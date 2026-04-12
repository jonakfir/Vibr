import { NextRequest } from "next/server";

/**
 * POST /api/vibe-code
 *
 * Streaming chat proxy for the IDE build page. The user supplies
 * their own API key (BYOK) — we never store it. We forward the
 * messages (and tool results from prior turns of the agent loop)
 * to the chosen provider and stream tokens + tool calls back as
 * SSE lines:
 *
 *   data: {"type":"content","text":"..."}\n\n
 *   data: {"type":"tool_use","id":"toolu_abc","name":"read_file","input":{...}}\n\n
 *   data: {"type":"done","stop_reason":"tool_use"}\n\n
 *
 * The client is responsible for executing the tool calls against
 * the user's local File System Access API handle and sending the
 * results back in the next POST as tool_result messages — this is
 * the Claude-Code-style agent loop, but with the file system on
 * the browser side instead of a server-side sandbox.
 *
 * Supported providers:
 *   - anthropic  → Anthropic Messages API (tool use enabled)
 *   - openai     → OpenAI Chat Completions API (function calling)
 *   - gemini     → Google Generative Language API (function calling)
 *   - custom     → OpenAI-compatible endpoint at `baseUrl`
 *
 * On any error we still return a 200 streaming response with a
 * single content chunk that explains what went wrong, so the chat
 * UI surfaces the actual problem instead of a generic
 * "Connection error".
 */

type Provider = "anthropic" | "openai" | "gemini" | "custom";

/** A normalized content block used in our cross-provider message
 *  format. The client sends and receives these. */
type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    };

interface ChatMessage {
  role: "user" | "assistant";
  // Messages can be either plain strings (simple chat turns) or an
  // array of content blocks (turns that contain tool_use / tool_result).
  content: string | ContentBlock[];
}

interface RequestBody {
  messages?: ChatMessage[];
  provider?: Provider;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  /** When true, include the tool definitions. The client passes
   *  this false for simple one-shot chats where no file-system
   *  access is wanted. */
  tools?: boolean;
}

/**
 * Vibr system prompt — tuned for the tool-using agent loop. The
 * earlier fence-based system prompt asked the model to emit code
 * blocks with file paths; now that we have real tool calls, we tell
 * the model to use them directly.
 */
const VIBR_SYSTEM_PROMPT = `You are Vibr, an AI coding agent that writes complete, working code into the user's local project folder. You behave like Claude Code: read files before editing, write the full contents of every file you touch, and iterate until the change is actually correct.

You have these tools available:
- read_file(path): read the current contents of a file. Always read a file before editing it unless you are creating it fresh.
- list_directory(path?): list files and folders. Use this to discover the project structure before making assumptions.
- write_file(path, content): write the FULL new contents of a file. Never write partial files — your output replaces the file on disk.
- run_check(): ask the user to report any errors they are seeing (TypeScript, lint, runtime). Use this after a batch of edits to verify.
- finish(summary, next_steps): call this when you're done. The summary is a 1-2 sentence recap and next_steps is an array of 2-4 short suggestions for what the user could ask next.

WORKFLOW on every turn:
1. If this is a new feature, first use list_directory and read_file to understand the relevant existing code.
2. Plan the change in 1-2 sentences of plain prose BEFORE calling any tools.
3. Call write_file for each file you need to create or modify. One call per file. Always include the FULL new contents — partial files corrupt the user's project.
4. When everything is written, call finish with a short summary and 2-4 next steps.

Rules that are not optional:
- Never abbreviate with "// rest of file" or "// existing imports" in write_file contents. The full file text replaces what's on disk, so any omission is a real data loss.
- Default tech stack when none is specified: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase + Vercel. Use shadcn/ui patterns for components.
- If a file already has content, read_file it first so you can preserve the parts you aren't changing.
- Keep prose terse. Don't recap what the user asked. Get to the tools.
- Make a reasonable assumption instead of asking clarifying questions. Call finish with the assumption in the summary.`;

const TOOL_DEFINITIONS_ANTHROPIC = [
  {
    name: "read_file",
    description:
      "Read the current contents of a file at the given path relative to the project root. Use this before editing any existing file so you can preserve the parts you aren't changing.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path to the file, e.g. 'src/app/page.tsx'.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "list_directory",
    description:
      "List files and folders at the given directory path. Omit path to list the project root. Use this to discover the project structure before making assumptions.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description:
            "Relative directory path. Omit or pass empty string for the project root.",
        },
      },
    },
  },
  {
    name: "write_file",
    description:
      "Write the FULL new contents of a file at the given path relative to the project root. Intermediate directories are created automatically. IMPORTANT: the content you provide completely replaces any existing file, so it must be the complete file, not a patch.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path to the file.",
        },
        content: {
          type: "string",
          description: "The complete new file contents.",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_check",
    description:
      "Ask the user to report any TypeScript / lint / runtime errors they see after the latest batch of changes. Use this to verify your edits compile before calling finish.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "finish",
    description:
      "Call this when the current user request is complete. The summary is a 1-2 sentence recap of what you changed. next_steps is an array of 2-4 short imperative suggestions for what the user could ask next.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        next_steps: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["summary", "next_steps"],
    },
  },
] as const;

function sseEncode(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function errorStream(message: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(sseEncode({ type: "content", text: message })));
      controller.enqueue(
        enc.encode(sseEncode({ type: "done", stop_reason: "error" }))
      );
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
  const toolsEnabled = body.tools !== false;

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
      return await streamAnthropic(apiKey, model, messages, toolsEnabled);
    }
    // OpenAI, Gemini, and Custom providers get the old fence-based
    // system prompt without tool use — we only support the agent
    // loop on Anthropic for now. The fallback is still useful for
    // users who BYOK another provider.
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
/*  Anthropic with tool use                                            */
/* ──────────────────────────────────────────────────────────────────── */

/** Convert our cross-provider ChatMessage format to Anthropic's
 *  messages API shape. Anthropic expects user messages with
 *  tool_result blocks to carry the results of prior tool_use calls. */
function toAnthropicMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    // Array of content blocks — pass through as-is. Anthropic's API
    // accepts this shape natively.
    return { role: m.role, content: m.content };
  });
}

async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  toolsEnabled: boolean
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
      max_tokens: 8192,
      stream: true,
      system: VIBR_SYSTEM_PROMPT,
      tools: toolsEnabled ? TOOL_DEFINITIONS_ANTHROPIC : undefined,
      messages: toAnthropicMessages(messages),
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return errorStream(
      `Anthropic API error (${upstream.status}): ${text || "no body"}`
    );
  }

  /** Stream the upstream SSE and translate Anthropic's events into
   *  our simpler {type: content|tool_use|done} shape. Anthropic's
   *  streaming format splits a tool call across several events:
   *
   *   content_block_start (type: tool_use, id, name, partial empty input)
   *   content_block_delta (input_json_delta)*   — accumulates JSON string
   *   content_block_stop
   *
   *  We buffer the partial_json string per-block and emit a single
   *  tool_use event at content_block_stop with the parsed input. */
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      // State for in-progress tool_use blocks keyed by block index.
      const toolBlocks = new Map<
        number,
        { id: string; name: string; jsonBuf: string }
      >();
      let stopReason: string | null = null;

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

              if (parsed.type === "content_block_start") {
                const idx = parsed.index as number;
                const block = parsed.content_block;
                if (block?.type === "tool_use") {
                  toolBlocks.set(idx, {
                    id: block.id,
                    name: block.name,
                    jsonBuf: "",
                  });
                }
              } else if (parsed.type === "content_block_delta") {
                const idx = parsed.index as number;
                if (parsed.delta?.type === "text_delta") {
                  controller.enqueue(
                    enc.encode(
                      sseEncode({
                        type: "content",
                        text: parsed.delta.text as string,
                      })
                    )
                  );
                } else if (parsed.delta?.type === "input_json_delta") {
                  const tb = toolBlocks.get(idx);
                  if (tb) {
                    tb.jsonBuf += (parsed.delta.partial_json as string) || "";
                  }
                }
              } else if (parsed.type === "content_block_stop") {
                const idx = parsed.index as number;
                const tb = toolBlocks.get(idx);
                if (tb) {
                  // Parse the assembled input JSON. Empty string means
                  // the tool takes no args (e.g. list_directory with no
                  // path).
                  let input: Record<string, unknown> = {};
                  if (tb.jsonBuf) {
                    try {
                      input = JSON.parse(tb.jsonBuf);
                    } catch {
                      input = { __parse_error: tb.jsonBuf };
                    }
                  }
                  controller.enqueue(
                    enc.encode(
                      sseEncode({
                        type: "tool_use",
                        id: tb.id,
                        name: tb.name,
                        input,
                      })
                    )
                  );
                  toolBlocks.delete(idx);
                }
              } else if (parsed.type === "message_delta") {
                if (parsed.delta?.stop_reason) {
                  stopReason = parsed.delta.stop_reason as string;
                }
              } else if (parsed.type === "message_stop") {
                // final event
              } else if (parsed.type === "error") {
                controller.enqueue(
                  enc.encode(
                    sseEncode({
                      type: "content",
                      text: `\n\n[API error: ${
                        parsed.error?.message ?? "unknown"
                      }]`,
                    })
                  )
                );
              }
            } catch {
              /* skip malformed */
            }
          }
        }
        controller.enqueue(
          enc.encode(sseEncode({ type: "done", stop_reason: stopReason }))
        );
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
/*  OpenAI / Custom (OpenAI-compatible) — no tool use for now          */
/* ──────────────────────────────────────────────────────────────────── */

async function streamOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response> {
  // Flatten content blocks down to plain strings for OpenAI-style
  // providers — we haven't wired up their function-calling shape yet.
  const flatMessages = messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content
            .map((b) =>
              b.type === "text"
                ? b.text
                : b.type === "tool_use"
                  ? ""
                  : b.type === "tool_result"
                    ? b.content
                    : ""
            )
            .join("\n"),
  }));

  const upstream = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 8192,
      messages: [
        { role: "system", content: VIBR_SYSTEM_PROMPT },
        ...flatMessages,
      ],
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
        controller.enqueue(
          enc.encode(sseEncode({ type: "done", stop_reason: "end_turn" }))
        );
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
/*  Google Gemini — no tool use for now                                */
/* ──────────────────────────────────────────────────────────────────── */

async function streamGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<Response> {
  const flatContents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [
      {
        text:
          typeof m.content === "string"
            ? m.content
            : m.content
                .map((b) =>
                  b.type === "text"
                    ? b.text
                    : b.type === "tool_result"
                      ? b.content
                      : ""
                )
                .join("\n"),
      },
    ],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        role: "system",
        parts: [{ text: VIBR_SYSTEM_PROMPT }],
      },
      generationConfig: {
        maxOutputTokens: 8192,
      },
      contents: flatContents,
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
        controller.enqueue(
          enc.encode(sseEncode({ type: "done", stop_reason: "end_turn" }))
        );
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
