/**
 * Client-side agent loop for the Vibr build page.
 *
 * The /api/vibe-code route streams Anthropic's tool-use events back
 * to us as SSE. We handle each stream by:
 *   1. Appending streamed text deltas to the in-progress assistant
 *      message so the UI updates live.
 *   2. Collecting tool_use events into an assistant message whose
 *      content is an array of blocks.
 *   3. When the stream finishes, executing every tool_use locally
 *      against the File System Access API (read_file,
 *      list_directory) or staging a pending write (write_file), and
 *      posting the results back to /api/vibe-code as a new turn.
 *   4. Looping until the model returns a response with no more
 *      tool_use blocks (or stops explicitly via the `finish` tool).
 *
 * The staged writes are returned to the caller so the build page can
 * show its existing DiffModal for approval — writes are NEVER applied
 * inside the agent loop. The user always reviews the batch before
 * anything hits disk.
 */

import {
  listAllPaths,
  readFileOrEmpty,
} from "@/lib/vibr-local";
import type { PendingWrite } from "./diff-modal";

export type ContentBlock =
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
  // Attached after the diff modal runs — which files were actually
  // written to disk this turn.
  writes?: { path: string; ok: boolean; error?: string }[];
  // Populated when the model calls the `finish` tool.
  summary?: string;
  nextSteps?: string[];
}

export interface AgentConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AgentCallbacks {
  /** Replace the messages array wholesale. The caller is responsible
   *  for persistence and rendering. */
  onMessages: (fn: (prev: ChatMessage[]) => ChatMessage[]) => void;
  /** Called once per turn after the stream ends, with any write_file
   *  calls the model made. The caller shows the DiffModal and
   *  eventually resolves with the subset the user approved. The
   *  agent loop waits for this promise before continuing. */
  onStageWrites: (
    writes: PendingWrite[]
  ) => Promise<{ path: string; ok: boolean; error?: string }[]>;
  /** Called when the model calls run_check — returns any user-typed
   *  error report to feed back into the next turn. */
  onRunCheck: () => Promise<string>;
  /** Toggle the streaming indicator in the UI. */
  onStreamingChange: (streaming: boolean) => void;
}

// Safety cap: stop after this many tool-using turns per user request
// so a buggy model can't burn through the user's API budget.
const MAX_AGENT_TURNS = 10;

/* ── Tool executors ── */

async function execReadFile(input: Record<string, unknown>): Promise<string> {
  const path = typeof input.path === "string" ? input.path : "";
  if (!path) return "Error: read_file requires a 'path' argument.";
  try {
    const content = await readFileOrEmpty(path);
    if (content === "") {
      return `File '${path}' is empty or does not exist.`;
    }
    return content;
  } catch (err) {
    return `Error reading ${path}: ${
      err instanceof Error ? err.message : "unknown error"
    }`;
  }
}

async function execListDirectory(
  input: Record<string, unknown>
): Promise<string> {
  const path = typeof input.path === "string" ? input.path : "";
  try {
    const all = await listAllPaths(500);
    if (path === "" || path === ".") {
      // Show top-level directories + a truncated file list so the
      // model can decide where to drill in.
      const roots = new Set<string>();
      const files: string[] = [];
      for (const p of all) {
        const seg = p.split("/");
        if (seg.length === 1) files.push(p);
        else roots.add(seg[0]);
      }
      const lines = [
        ...Array.from(roots).sort().map((d) => `${d}/`),
        ...files.sort(),
      ];
      return lines.length > 0
        ? lines.join("\n")
        : "(project root is empty)";
    }
    // Filter to direct children of `path`.
    const prefix = path.endsWith("/") ? path : path + "/";
    const children = new Set<string>();
    for (const p of all) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const first = rest.split("/")[0];
      if (!first) continue;
      children.add(rest.includes("/") ? `${first}/` : first);
    }
    if (children.size === 0) return `(no files in ${path})`;
    return Array.from(children).sort().join("\n");
  } catch (err) {
    return `Error listing ${path || "root"}: ${
      err instanceof Error ? err.message : "unknown error"
    }`;
  }
}

/** write_file is NOT executed inside the loop — we stage it and let
 *  the DiffModal handle approval. The tool result the model sees is
 *  optimistic: "staged write to path.ext (N bytes). Awaiting user
 *  approval at end of turn." This keeps the model moving. */
function stageWrite(
  input: Record<string, unknown>,
  staged: PendingWrite[]
): Promise<string> {
  const path = typeof input.path === "string" ? input.path : "";
  const content = typeof input.content === "string" ? input.content : "";
  if (!path || !content) {
    return Promise.resolve(
      "Error: write_file requires both 'path' and 'content' arguments."
    );
  }
  return readFileOrEmpty(path).then((existing) => {
    staged.push({
      path,
      oldContent: existing,
      newContent: content,
      isNew: existing.length === 0,
    });
    return `Staged write to ${path} (${content.length} bytes). The user will review all staged writes at the end of your turn.`;
  });
}

/* ── Stream handler ── */

interface StreamEvent {
  type: "content" | "tool_use" | "done";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  stop_reason?: string;
}

/* ── Public entry point ── */

export async function runAgentLoop(
  firstUserMessage: ChatMessage,
  priorMessages: ChatMessage[],
  config: AgentConfig,
  callbacks: AgentCallbacks
): Promise<void> {
  callbacks.onStreamingChange(true);

  // Seed the conversation with the prior history + the new user
  // message. We mutate a local copy and reflect into the UI via
  // callbacks.onMessages as things progress.
  let conversation: ChatMessage[] = [...priorMessages, firstUserMessage];
  callbacks.onMessages(() => conversation);

  // Every turn appends an empty assistant message that we mutate in
  // place as text streams in, then finalize with any tool blocks.
  try {
    for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
      // Open an assistant placeholder.
      let assistantText = "";
      const stagedThisTurn: PendingWrite[] = [];
      const toolUses: Extract<ContentBlock, { type: "tool_use" }>[] = [];

      conversation = [
        ...conversation,
        { role: "assistant", content: "" },
      ];
      callbacks.onMessages(() => conversation);

      // Fire the stream.
      const res = await fetch("/api/vibe-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.slice(0, -1), // exclude the empty placeholder
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          tools: true,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        const errMsg = (err as { error?: string }).error ?? `HTTP ${res.status}`;
        conversation[conversation.length - 1] = {
          role: "assistant",
          content: `Error: ${errMsg}`,
        };
        callbacks.onMessages(() => conversation);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let stopReason: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const ev: StreamEvent = JSON.parse(trimmed.slice(6));
            if (ev.type === "content" && typeof ev.text === "string") {
              assistantText += ev.text;
              conversation[conversation.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              callbacks.onMessages(() => [...conversation]);
            } else if (
              ev.type === "tool_use" &&
              ev.id &&
              ev.name &&
              ev.input
            ) {
              toolUses.push({
                type: "tool_use",
                id: ev.id,
                name: ev.name,
                input: ev.input,
              });
            } else if (ev.type === "done") {
              stopReason = ev.stop_reason ?? null;
            }
          } catch {
            /* skip malformed */
          }
        }
      }

      // Finalize this turn's assistant message. If we got any tool
      // calls, the content becomes an array of blocks (text first,
      // then each tool_use). Otherwise stays a plain string.
      if (toolUses.length > 0) {
        const blocks: ContentBlock[] = [];
        if (assistantText.trim().length > 0) {
          blocks.push({ type: "text", text: assistantText });
        }
        for (const tu of toolUses) blocks.push(tu);
        conversation[conversation.length - 1] = {
          role: "assistant",
          content: blocks,
        };
      } else {
        conversation[conversation.length - 1] = {
          role: "assistant",
          content: assistantText,
        };
      }
      callbacks.onMessages(() => [...conversation]);

      // No tools called → the model is done talking this user turn.
      if (toolUses.length === 0) {
        return;
      }

      // Execute each tool. write_file calls are staged (not applied),
      // read_file and list_directory run immediately, run_check and
      // finish have custom handling.
      const toolResults: ContentBlock[] = [];
      let finishSummary: string | undefined;
      let finishSteps: string[] | undefined;

      for (const tu of toolUses) {
        let resultContent: string;
        let isError = false;

        try {
          if (tu.name === "read_file") {
            resultContent = await execReadFile(tu.input);
          } else if (tu.name === "list_directory") {
            resultContent = await execListDirectory(tu.input);
          } else if (tu.name === "write_file") {
            resultContent = await stageWrite(tu.input, stagedThisTurn);
          } else if (tu.name === "run_check") {
            const report = await callbacks.onRunCheck();
            resultContent =
              report || "No errors reported by the user so far.";
          } else if (tu.name === "finish") {
            finishSummary =
              (tu.input.summary as string | undefined) ?? undefined;
            finishSteps =
              (tu.input.next_steps as string[] | undefined) ?? undefined;
            resultContent = "Finish acknowledged. Ending turn.";
          } else {
            resultContent = `Error: unknown tool '${tu.name}'.`;
            isError = true;
          }
        } catch (err) {
          resultContent = `Error running ${tu.name}: ${
            err instanceof Error ? err.message : "unknown"
          }`;
          isError = true;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: resultContent,
          is_error: isError,
        });
      }

      // If the model called write_file this turn, show the diff
      // modal and wait for the user to approve a subset.
      if (stagedThisTurn.length > 0) {
        const writeResults = await callbacks.onStageWrites(stagedThisTurn);
        // Attach the results to the last assistant message so the
        // chat shows the "Files written" panel.
        conversation = conversation.map((m, i) => {
          if (i !== conversation.length - 1) return m;
          return { ...m, writes: writeResults };
        });
        callbacks.onMessages(() => [...conversation]);
      }

      // If the model called `finish`, attach the summary + next
      // steps to the assistant message and stop looping.
      if (finishSummary || finishSteps) {
        conversation = conversation.map((m, i) => {
          if (i !== conversation.length - 1) return m;
          return {
            ...m,
            summary: finishSummary,
            nextSteps: finishSteps,
          };
        });
        callbacks.onMessages(() => [...conversation]);
      }

      // Push the tool results as a user turn and continue the loop.
      conversation = [
        ...conversation,
        { role: "user", content: toolResults },
      ];
      callbacks.onMessages(() => [...conversation]);

      // Exit conditions: model called finish, or the stop reason
      // wasn't tool_use (meaning the model actually finished).
      if (finishSummary || finishSteps) return;
      if (stopReason && stopReason !== "tool_use") return;
    }

    // Hit the safety cap — tell the user.
    conversation = [
      ...conversation,
      {
        role: "assistant",
        content: `Hit the ${MAX_AGENT_TURNS}-turn safety cap. Send another message to continue.`,
      },
    ];
    callbacks.onMessages(() => [...conversation]);
  } catch (err) {
    conversation = [
      ...conversation,
      {
        role: "assistant",
        content: `Connection error: ${
          err instanceof Error ? err.message : "Unknown error"
        }.`,
      },
    ];
    callbacks.onMessages(() => [...conversation]);
  } finally {
    callbacks.onStreamingChange(false);
  }
}
