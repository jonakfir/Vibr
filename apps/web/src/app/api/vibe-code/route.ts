import { NextRequest } from "next/server";

/**
 * POST /api/vibe-code
 *
 * Streaming chat proxy used by the build page. The user supplies their
 * own API key (BYOK) — we never store it. We forward the messages to the
 * chosen provider and stream tokens back as SSE-style lines:
 *
 *   data: {"type":"content","text":"..."}\n
 *
 * The build page parses these and appends them to the in-progress
 * assistant message.
 *
 * Supported providers:
 *   - anthropic  → Anthropic Messages API
 *   - openai     → OpenAI Chat Completions API
 *   - gemini     → Google Generative Language API
 *   - custom     → OpenAI-compatible endpoint at `baseUrl`
 *
 * On any error we still return a streaming response with a single
 * content chunk that explains what went wrong, so the chat UI surfaces
 * the actual problem instead of a generic "Connection error".
 */

type Provider = "anthropic" | "openai" | "gemini" | "custom";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages?: ChatMessage[];
  provider?: Provider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

function sseEncode(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function errorStream(message: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(sseEncode({ type: "content", text: message })));
      controller.enqueue(enc.encode(sseEncode({ type: "done" })));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const provider: Provider = body.provider ?? "anthropic";
  const apiKey = body.apiKey?.trim();
  const model = body.model?.trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const baseUrl = body.baseUrl?.trim();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing apiKey" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!model) {
    return new Response(JSON.stringify({ error: "Missing model" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages array is empty" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (provider === "anthropic") {
      return await streamAnthropic(apiKey, model, messages);
    }
    if (provider === "openai") {
      return await streamOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        model,
        messages
      );
    }
    if (provider === "gemini") {
      return await streamGemini(apiKey, model, messages);
    }
    if (provider === "custom") {
      const url =
        (baseUrl ? baseUrl.replace(/\/$/, "") : "") + "/chat/completions";
      if (!baseUrl) {
        return errorStream("Custom provider requires a base URL.");
      }
      return await streamOpenAICompatible(url, apiKey, model, messages);
    }
    return errorStream(`Unknown provider: ${provider}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return errorStream(`Connection error: ${msg}`);
  }
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Anthropic                                                          */
/* ──────────────────────────────────────────────────────────────────── */

async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response> {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return errorStream(
      `Anthropic API error (${upstream.status}): ${text || "no body"}`
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.type === "text_delta" &&
                typeof parsed.delta.text === "string"
              ) {
                controller.enqueue(
                  enc.encode(
                    sseEncode({ type: "content", text: parsed.delta.text })
                  )
                );
              }
            } catch {
              /* skip malformed */
            }
          }
        }
        controller.enqueue(enc.encode(sseEncode({ type: "done" })));
      } catch (err) {
        controller.enqueue(
          enc.encode(
            sseEncode({
              type: "content",
              text: `\n\n[stream error: ${
                err instanceof Error ? err.message : "unknown"
              }]`,
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

/* ──────────────────────────────────────────────────────────────────── */
/*  OpenAI / Custom (OpenAI-compatible)                                */
/* ──────────────────────────────────────────────────────────────────── */

async function streamOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response> {
  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return errorStream(
      `Provider error (${upstream.status}): ${text || "no body"}`
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const text = parsed.choices?.[0]?.delta?.content;
              if (typeof text === "string" && text.length > 0) {
                controller.enqueue(
                  enc.encode(sseEncode({ type: "content", text }))
                );
              }
            } catch {
              /* skip malformed */
            }
          }
        }
        controller.enqueue(enc.encode(sseEncode({ type: "done" })));
      } catch (err) {
        controller.enqueue(
          enc.encode(
            sseEncode({
              type: "content",
              text: `\n\n[stream error: ${
                err instanceof Error ? err.message : "unknown"
              }]`,
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Google Gemini                                                      */
/* ──────────────────────────────────────────────────────────────────── */

async function streamGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response> {
  // Gemini's streamGenerateContent endpoint returns a JSON array of
  // partial responses; we parse them as they arrive.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return errorStream(
      `Gemini API error (${upstream.status}): ${text || "no body"}`
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            try {
              const parsed = JSON.parse(payload);
              const parts = parsed.candidates?.[0]?.content?.parts ?? [];
              for (const part of parts) {
                if (typeof part.text === "string" && part.text.length > 0) {
                  controller.enqueue(
                    enc.encode(sseEncode({ type: "content", text: part.text }))
                  );
                }
              }
            } catch {
              /* skip malformed */
            }
          }
        }
        controller.enqueue(enc.encode(sseEncode({ type: "done" })));
      } catch (err) {
        controller.enqueue(
          enc.encode(
            sseEncode({
              type: "content",
              text: `\n\n[stream error: ${
                err instanceof Error ? err.message : "unknown"
              }]`,
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
  });
}
