import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, subscription_status")
      .eq("id", user.id)
      .single();

    const { hasProAccess } = await import("@/lib/auth");
    if (!hasProAccess(profileData?.email, profileData?.subscription_status)) {
      return new Response(JSON.stringify({ error: "pro_required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, provider, apiKey, model, baseUrl } = await request.json();

    if (!messages || !provider || !apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: messages, provider, apiKey",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (provider === "anthropic") {
      return streamAnthropic(messages, apiKey, model);
    } else {
      // OpenAI-compatible: openai, gemini, custom
      return streamOpenAICompatible(messages, apiKey, model, baseUrl, provider);
    }
  } catch (error) {
    console.error("Vibe code error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model?: string
): Promise<Response> {
  const anthropic = new Anthropic({ apiKey });

  const stream = anthropic.messages.stream({
    model: model || "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    system:
      "You are an expert full-stack developer. Help the user build their product by writing clean, production-ready code. Provide complete file contents when asked. Use modern best practices.",
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const response = await stream.finalMessage();
        // Use event-based streaming
        stream.on("text", (text) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "content", text })}\n\n`)
          );
        });

        stream.on("error", (error) => {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
            )
          );
          controller.close();
        });

        stream.on("end", () => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        });
      } catch {
        // Fallback: use the stream as an async iterator
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "content", text: event.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function streamOpenAICompatible(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  model?: string,
  baseUrl?: string,
  provider?: string
): Promise<Response> {
  const defaultUrls: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
    custom: baseUrl || "",
  };

  const defaultModels: Record<string, string> = {
    openai: "gpt-4o",
    gemini: "gemini-2.0-flash",
    custom: model || "gpt-4o",
  };

  const url = baseUrl || defaultUrls[provider || "openai"] || defaultUrls.openai;
  const selectedModel = model || defaultModels[provider || "openai"];

  const response = await fetch(`${url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content:
            "You are an expert full-stack developer. Help the user build their product by writing clean, production-ready code. Provide complete file contents when asked. Use modern best practices.",
        },
        ...messages,
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return new Response(
      JSON.stringify({
        error: `Provider API error: ${response.status}`,
        details: errorBody,
      }),
      { status: response.status, headers: { "Content-Type": "application/json" } }
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return new Response(JSON.stringify({ error: "No response stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "done" })}\n\n`
                )
              );
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "content", text: content })}\n\n`
                  )
                );
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Stream error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
