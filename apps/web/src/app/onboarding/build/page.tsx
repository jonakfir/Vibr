"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, File, Terminal, X, ChevronRight, ChevronDown } from "lucide-react";
import { GhostButton } from "@/components/ui/ghost-button";
import { useStore } from "@/lib/store";
import {
  checkConnection,
  getFiles,
  readFile,
  readFileOrEmpty,
  listAllPaths,
  openFolderPicker,
  writeFile,
  connectTerminal,
  type FileNode,
} from "@/lib/vibr-local";
import { DiffModal, type PendingWrite } from "./diff-modal";
import { highlight, langFromPath } from "./highlight";

/* ─── types ─── */

type Provider = "anthropic" | "openai" | "gemini" | "custom";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  // populated after streaming completes if any code blocks were written
  // out to disk
  writes?: WriteResult[];
}

interface WriteResult {
  path: string;
  ok: boolean;
  error?: string;
}

/* Pulls (path, content) pairs out of a streamed assistant message.
 *
 * Looks for code fences preceded by a line that names a file path,
 * either as a markdown heading, a backticked path, or a "Step N:
 * Update `src/foo.ts`:" pattern. The path can also be embedded in the
 * fence itself like ```ts:src/foo.ts. Returns one entry per detected
 * file. Files without a detectable path are skipped — we never write
 * arbitrary code into the user's project. */
function extractFileBlocks(
  text: string
): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  const lines = text.split("\n");
  let i = 0;
  let lastPathHint: string | null = null;
  const pathRe = /([\w./\-_]+\.(?:tsx?|jsx?|css|scss|json|md|mdx|html|svg|ya?ml|toml|sh|env|gitignore|prisma|sql|py|rs|go|java|kt|swift|c|cpp|h|rb|php|astro|vue|svelte))/i;
  // Opening fence variants we accept:
  //   ```typescript src/app/page.tsx
  //   ```ts src/app/page.tsx
  //   ```ts:src/app/page.tsx
  //   ```ts file=src/app/page.tsx
  //   ``` src/app/page.tsx
  const fenceOpenRe = /^```([\w+\-]*)?(?:[\s:]+(?:file=)?(.+?))?\s*$/;

  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = fenceOpenRe.exec(line);
    if (fenceMatch && line.startsWith("```")) {
      let path: string | null = null;
      const info = (fenceMatch[2] ?? "").trim();
      if (info && pathRe.test(info)) {
        path = pathRe.exec(info)![1];
      }
      if (!path && lastPathHint) path = lastPathHint;

      // Collect content until the closing fence
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      // Skip closing fence
      if (i < lines.length) i++;

      if (path) {
        out.push({ path: path.trim(), content: buf.join("\n") });
        lastPathHint = null;
      }
      continue;
    }

    // Capture path hints from prose. Prefer backticked paths.
    const inline = /`([\w./\-_]+\.(?:tsx?|jsx?|css|scss|json|md|mdx|html|svg|ya?ml|toml|sh|env|gitignore|prisma|sql|py|rs|go|java|kt|swift|c|cpp|h|rb|php|astro|vue|svelte))`/i.exec(
      line
    );
    if (inline) {
      lastPathHint = inline[1];
    } else {
      const bare = pathRe.exec(line);
      if (bare && /update|create|add|edit|file|new|in\s/i.test(line)) {
        lastPathHint = bare[1];
      }
    }

    i++;
  }
  return out;
}

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  custom: "gpt-4o",
};

/* ─── markdown renderer ───
   Streaming-aware: walks the text manually so an unclosed ``` fence at
   the end (very common while the assistant is mid-stream) still gets
   rendered as code instead of dumped as raw prose.

   Escapes HTML inside code blocks so things like `<div>` show literally
   instead of being parsed by the browser. Inline `code`, **bold**, and
   *italic* are supported in prose. Lines starting with "- " become
   bullet points. Lines starting with "# " become headings. */

type MdPart =
  | { kind: "prose"; text: string }
  | {
      kind: "code";
      lang: string;
      path: string | null;
      text: string;
      closed: boolean;
    };

function splitFenceInfo(info: string): { lang: string; path: string | null } {
  // Accepts: "typescript src/foo.ts", "ts:src/foo.ts", "ts file=src/foo.ts",
  // "typescript", or just "src/foo.ts".
  const trimmed = info.trim();
  if (!trimmed) return { lang: "", path: null };

  // ts:path
  if (trimmed.includes(":")) {
    const [lang, ...rest] = trimmed.split(":");
    const after = rest.join(":").trim();
    if (after) return { lang: lang.trim(), path: after };
  }
  // ts file=path
  const fileEq = /\bfile=([^\s]+)/.exec(trimmed);
  if (fileEq) {
    return {
      lang: trimmed.replace(fileEq[0], "").trim(),
      path: fileEq[1].trim(),
    };
  }
  // ts path
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return { lang: parts[0], path: parts.slice(1).join(" ") };
  }
  // bare token: language only, unless it looks like a path
  if (/[./]/.test(trimmed)) {
    return { lang: "", path: trimmed };
  }
  return { lang: trimmed, path: null };
}

function parseMarkdown(text: string): MdPart[] {
  const parts: MdPart[] = [];
  let i = 0;
  while (i < text.length) {
    const fence = text.indexOf("```", i);
    if (fence === -1) {
      if (i < text.length) parts.push({ kind: "prose", text: text.slice(i) });
      break;
    }
    if (fence > i) parts.push({ kind: "prose", text: text.slice(i, fence) });

    // language up to the next newline
    const langEnd = text.indexOf("\n", fence + 3);
    if (langEnd === -1) {
      // fence with no newline yet — render as empty in-progress code block
      const info = splitFenceInfo(text.slice(fence + 3));
      parts.push({
        kind: "code",
        lang: info.lang,
        path: info.path,
        text: "",
        closed: false,
      });
      break;
    }
    const info = splitFenceInfo(text.slice(fence + 3, langEnd));
    const close = text.indexOf("```", langEnd + 1);
    if (close === -1) {
      // unterminated → render whatever we have so far as code
      parts.push({
        kind: "code",
        lang: info.lang,
        path: info.path,
        text: text.slice(langEnd + 1),
        closed: false,
      });
      break;
    }
    parts.push({
      kind: "code",
      lang: info.lang,
      path: info.path,
      text: text.slice(langEnd + 1, close),
      closed: true,
    });
    i = close + 3;
    // skip a single trailing newline so the gap to the next prose block
    // looks tight, like a chat message in an IDE
    if (text[i] === "\n") i++;
  }
  return parts;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderProseLine(line: string, key: string): React.ReactNode {
  // headings
  const h = /^(#{1,3})\s+(.*)$/.exec(line);
  if (h) {
    const level = h[1].length;
    const cls =
      level === 1
        ? "font-heading text-foreground text-[18px] mt-4 mb-2"
        : level === 2
          ? "font-heading text-foreground text-[16px] mt-3 mb-1.5"
          : "font-heading text-foreground text-[14px] mt-2 mb-1";
    return (
      <div
        key={key}
        className={cls}
        dangerouslySetInnerHTML={{ __html: inlineFormat(h[2]) }}
      />
    );
  }
  // bullet
  if (/^[-*]\s+/.test(line)) {
    return (
      <div key={key} className="flex gap-2 ml-1">
        <span className="text-muted">&bull;</span>
        <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />
      </div>
    );
  }
  if (line.trim() === "") {
    return <div key={key} className="h-2" />;
  }
  return (
    <div
      key={key}
      dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
    />
  );
}

function inlineFormat(line: string): string {
  // Order matters — code first so its contents aren't touched by **/*.
  return escapeHtml(line)
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-[#0d0d0d] text-foreground px-1.5 py-0.5 text-[12px] font-mono border border-border rounded">$1</code>'
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function CodeBlock({
  lang,
  path,
  text,
  closed,
  defaultOpen = false,
}: {
  lang: string;
  path: string | null;
  text: string;
  closed: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(defaultOpen || !closed);
  const lineCount = text.split("\n").length;
  const label = path || lang || "code";

  return (
    <div className="my-3 border border-border rounded-md overflow-hidden bg-[#0a0a0a]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-[#0d0d0d] hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${
              open ? "rotate-90" : ""
            }`}
          />
          {path ? (
            <>
              <span className="font-body text-[12px] text-muted">Edit</span>
              <span className="font-mono text-[12px] text-foreground truncate">
                {path}
              </span>
            </>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {lang || "code"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!closed ? (
            <span className="font-mono text-[10px] text-muted/60 animate-pulse">
              streaming…
            </span>
          ) : (
            <span className="font-mono text-[10px] text-muted/60">
              {lineCount} line{lineCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </button>
      {open && (
        <pre
          aria-label={label}
          className="overflow-x-auto px-4 py-3 font-mono text-[12px] leading-[1.55] text-foreground/90 border-t border-border"
        >
          <code
            dangerouslySetInnerHTML={{
              __html: highlight(text, lang || (path ? langFromPath(path) : "")),
            }}
          />
        </pre>
      )}
    </div>
  );
}

function renderMarkdown(text: string, defaultOpenCode = false) {
  const parts = parseMarkdown(text);
  return (
    <div className="space-y-2 leading-relaxed">
      {parts.map((part, i) => {
        if (part.kind === "prose") {
          const lines = part.text.split("\n");
          return (
            <div key={`p-${i}`}>
              {lines.map((line, li) =>
                renderProseLine(line, `p-${i}-${li}`)
              )}
            </div>
          );
        }
        return (
          <CodeBlock
            key={`c-${i}`}
            lang={part.lang}
            path={part.path}
            text={part.text}
            closed={part.closed}
            defaultOpen={defaultOpenCode || !part.closed}
          />
        );
      })}
    </div>
  );
}

/* ─── file tree component ─── */

function FileTree({
  nodes,
  depth = 0,
  onFileClick,
}: {
  nodes: FileNode[];
  depth?: number;
  onFileClick: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div>
      {nodes.map((node) => (
        <div key={node.path}>
          <button
            type="button"
            className="flex items-center gap-1.5 w-full text-left py-0.5 hover:text-foreground transition-colors duration-200"
            style={{ paddingLeft: `${depth * 12}px` }}
            onClick={() => {
              if (node.type === "directory") {
                setExpanded((prev) => ({
                  ...prev,
                  [node.path]: !prev[node.path],
                }));
              } else {
                onFileClick(node.path);
              }
            }}
          >
            {node.type === "directory" ? (
              <>
                {expanded[node.path] ? (
                  <ChevronDown className="w-3 h-3 text-muted" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted" />
                )}
                <Folder className="w-3 h-3 text-muted" />
              </>
            ) : (
              <>
                <span className="w-3" />
                <File className="w-3 h-3 text-muted" />
              </>
            )}
            <span className="font-mono text-xs text-muted truncate">
              {node.name}
            </span>
          </button>
          {node.type === "directory" &&
            expanded[node.path] &&
            node.children && (
              <FileTree
                nodes={node.children}
                depth={depth + 1}
                onFileClick={onFileClick}
              />
            )}
        </div>
      ))}
    </div>
  );
}

/* ─── main page ─── */

export default function BuildPage() {
  const router = useRouter();
  const selectedIdea = useStore((s) => s.selectedIdea);
  const productName = useStore((s) => s.productName);
  const flowMode = useStore((s) => s.flowMode);
  const projectDescription = useStore((s) => s.projectDescription);
  const prompt = useStore((s) => s.prompt);
  const setPrompt = useStore((s) => s.setPrompt);

  /* left panel */
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODELS.anthropic);
  const [baseUrl, setBaseUrl] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);

  /* credentials hydrate from localStorage on mount so the user doesn't
     have to re-enter their API key after every refresh. We persist
     under a single namespaced key. We use a state flag instead of a
     ref so the persist-effect runs in a render where state already
     reflects the hydrated values — this avoids clobbering localStorage
     with the empty defaults. */
  const [credsHydrated, setCredsHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vibr.byok");
      if (raw) {
        const c = JSON.parse(raw) as {
          provider?: Provider;
          apiKey?: string;
          model?: string;
          baseUrl?: string;
        };
        if (c.provider) setProvider(c.provider);
        if (typeof c.apiKey === "string") setApiKey(c.apiKey);
        if (typeof c.model === "string" && c.model) setModel(c.model);
        if (typeof c.baseUrl === "string") setBaseUrl(c.baseUrl);
      }
    } catch {
      /* ignore corrupted localStorage */
    } finally {
      setCredsHydrated(true);
    }
  }, []);

  /* persist whenever they change */
  useEffect(() => {
    if (!credsHydrated) return;
    try {
      localStorage.setItem(
        "vibr.byok",
        JSON.stringify({ provider, apiKey, model, baseUrl })
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [credsHydrated, provider, apiKey, model, baseUrl]);

  /* center panel */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesHydrated, setMessagesHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [inputPrefilled, setInputPrefilled] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* right panel */
  const [connected, setConnected] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);

  /* ── diff review + undo ──
     After a streamed assistant message contains file blocks, we never
     blindly write them anymore — we stash them in `pendingWrites`,
     show the DiffModal, and only write the subset the user approves.
     Every successful write also pushes the old contents onto an
     undo stack so the user can roll back the last batch. */
  const [pendingWrites, setPendingWrites] = useState<PendingWrite[] | null>(
    null
  );
  // A single entry holds everything written by one approval batch so
  // "Undo" rolls back a whole turn, not just one file.
  type UndoBatch = { files: { path: string; oldContent: string; isNew: boolean }[] };
  const [undoStack, setUndoStack] = useState<UndoBatch[]>([]);
  const [undoing, setUndoing] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  /* ── generate prompt on mount ── */

  const generatePrompt = useCallback(async () => {
    if (!selectedIdea || !productName) return;
    setGeneratingPrompt(true);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: selectedIdea, product_name: productName }),
      });
      const data = await res.json();
      if (data.prompt) setPrompt(data.prompt);
    } catch {
      /* silent */
    } finally {
      setGeneratingPrompt(false);
    }
  }, [selectedIdea, productName, setPrompt]);

  // Regenerate the build prompt whenever the selected idea or product
  // name changes. This fires on mount AND when the user picks a new
  // idea upstream. A ref tracks the last idea we generated for so the
  // effect doesn't re-trigger on other unrelated re-renders.
  const lastPromptForRef = useRef<string | null>(null);
  useEffect(() => {
    const fingerprint = `${
      (selectedIdea as { id?: string } | null)?.id ?? ""
    }:${productName}`;

    if (flowMode === "import") {
      // Import mode prompt is derived from the user-supplied project
      // description, not from the idea data. Only set it if empty.
      if (!prompt && projectDescription) {
        setPrompt(
          `Project: ${productName}\n\nDescription: ${projectDescription}\n\nConnect vibr-local and open your project folder to get started. You can ask the AI to analyze your codebase, add features, fix bugs, or refactor code.`
        );
      }
      lastPromptForRef.current = fingerprint;
      return;
    }

    if (!selectedIdea || !productName) return;
    if (lastPromptForRef.current === fingerprint && prompt) return;
    lastPromptForRef.current = fingerprint;
    generatePrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    (selectedIdea as { id?: string } | null)?.id,
    productName,
    flowMode,
  ]);

  /* Pre-fill the chat input with the generated first prompt so the user
     has a ready-to-send starter message. They can edit it before
     sending. We only do this once, and only when the conversation is
     still empty — never overwrite anything they've started typing. */
  useEffect(() => {
    if (inputPrefilled) return;
    if (messages.length > 0) return;
    if (!prompt) return;
    if (input.length > 0) return;
    setInput(prompt);
    setInputPrefilled(true);
  }, [prompt, messages.length, input.length, inputPrefilled]);

  /* ── vibr-local connection ── */

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let ws: WebSocket | null = null;

    const poll = async () => {
      const ok = await checkConnection();
      setConnected(ok);
      if (ok) {
        const tree = await getFiles();
        if (tree) setFiles(tree);
      }
    };

    poll();
    interval = setInterval(poll, 5000);

    // terminal websocket
    ws = connectTerminal();
    if (ws) {
      ws.onmessage = (e) => {
        setTerminalOutput((prev) => [...prev.slice(-200), e.data]);
      };
    }

    return () => {
      clearInterval(interval);
      ws?.close();
    };
  }, []);

  /* ── auto-scroll ── */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── conversation memory ──
     Persist the chat under a key derived from the selected idea (so
     each idea gets its own thread). Hydrate on mount, save after
     every change. Users expect their conversation to survive refresh
     and re-visits — that's the whole point of "memory of previous
     conversations". */
  const chatKey = `vibr.chat.${selectedIdea?.id ?? productName ?? "default"}`;

  useEffect(() => {
    if (messagesHydrated) return;
    try {
      const raw = localStorage.getItem(chatKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          // Don't pre-fill the input with the starter prompt if we
          // already have a conversation to resume.
          setInputPrefilled(true);
        }
      }
    } catch {
      /* ignore corrupted localStorage */
    } finally {
      setMessagesHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!messagesHydrated) return;
    try {
      if (messages.length === 0) {
        localStorage.removeItem(chatKey);
      } else {
        localStorage.setItem(chatKey, JSON.stringify(messages));
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, [messages, messagesHydrated, chatKey]);

  const clearChat = () => {
    if (!confirm("Clear this conversation? This can't be undone.")) return;
    setMessages([]);
    setInput("");
    setInputPrefilled(false);
    try {
      localStorage.removeItem(chatKey);
    } catch {
      /* ignore */
    }
  };

  /* ── diff review handlers ── */

  const handleApplyWrites = async (selectedPaths: string[]) => {
    if (!pendingWrites) return;
    const selected = pendingWrites.filter((w) => selectedPaths.includes(w.path));
    setPendingWrites(null);

    const writes: WriteResult[] = [];
    const undoEntry: UndoBatch = { files: [] };

    for (const w of selected) {
      try {
        await writeFile(w.path, w.newContent);
        writes.push({ path: w.path, ok: true });
        undoEntry.files.push({
          path: w.path,
          oldContent: w.oldContent,
          isNew: w.isNew,
        });
      } catch (err) {
        writes.push({
          path: w.path,
          ok: false,
          error: err instanceof Error ? err.message : "write failed",
        });
      }
    }

    // Attach the write results to the last assistant message so they
    // show up as a "Files written" panel under it.
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last.role === "assistant") {
        updated[updated.length - 1] = { ...last, writes };
      }
      return updated;
    });

    // Push the undo entry AFTER attaching writes so the button shows up.
    if (undoEntry.files.length > 0) {
      setUndoStack((prev) => [...prev, undoEntry].slice(-20));
    }

    // Refresh the file tree so newly-written files appear on the right.
    try {
      const tree = await getFiles();
      setFiles(tree ?? []);
    } catch {
      /* ignore tree refresh failure */
    }
  };

  const handleRejectWrites = () => {
    setPendingWrites(null);
    // Tell the user — but gently. No assistant message, just a toast-y
    // footnote on the last message.
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last.role === "assistant") {
        updated[updated.length - 1] = {
          ...last,
          writes: [{ path: "(changes rejected)", ok: false, error: "nothing written" }],
        };
      }
      return updated;
    });
  };

  const handleUndo = async () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoing(true);
    try {
      for (const f of last.files) {
        // If the file was newly created by vibr, rolling back means
        // restoring empty contents. We can't actually delete from the
        // File System Access API without a separate remove permission,
        // so we blank it out. Not perfect, but safe.
        await writeFile(f.path, f.oldContent);
      }
      setUndoStack((prev) => prev.slice(0, -1));
      try {
        const tree = await getFiles();
        setFiles(tree ?? []);
      } catch {
        /* ignore */
      }
    } finally {
      setUndoing(false);
    }
  };

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [terminalOutput]);

  /* ── provider change ──
     When the user changes provider, swap to the default model for that
     provider — but ONLY after hydration, otherwise hydrating "openai"
     from localStorage would clobber the saved model with the default. */

  const lastProviderRef = useRef<Provider | null>(null);
  useEffect(() => {
    if (!credsHydrated) {
      lastProviderRef.current = provider;
      return;
    }
    if (lastProviderRef.current === provider) return;
    lastProviderRef.current = provider;
    setModel(DEFAULT_MODELS[provider]);
  }, [provider, credsHydrated]);

  /* ── send message ── */

  const sendMessage = async () => {
    if (!input.trim() || streaming || !apiKey) return;
    if (!connected) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connect a project folder first — vibr needs read/write access so it can build the files for you on your own machine. Click \u201cOpen folder\u201d on the right.",
        },
      ]);
      return;
    }

    // Build a repo-context preamble for the FIRST user message in the
    // conversation. This gives the model the file tree + the contents
    // of key config files (package.json, tsconfig, README) so it can
    // write code that fits the project instead of hallucinating the
    // structure. We send this to the API only — the UI still shows
    // the user's short typed message, not the 5KB context dump.
    let apiUserContent = input.trim();
    const displayUserContent = input.trim();
    if (messages.length === 0) {
      try {
        const paths = await listAllPaths(300);
        if (paths.length > 0) {
          const tree = paths.map((p) => `- ${p}`).join("\n");
          const keyFiles = [
            "package.json",
            "tsconfig.json",
            "next.config.js",
            "next.config.mjs",
            "tailwind.config.ts",
            "tailwind.config.js",
            "README.md",
          ];
          const snippets: string[] = [];
          for (const key of keyFiles) {
            if (!paths.includes(key)) continue;
            const content = await readFileOrEmpty(key);
            if (content && content.length < 4000) {
              snippets.push(`\n### \`${key}\`\n\n\`\`\`\n${content}\n\`\`\``);
            }
          }
          const contextBlock = `## Project context

I'm working in a folder called "${folderName || "project"}" with ${paths.length} files. Here is the file tree:

${tree}
${snippets.length > 0 ? `\n### Key files\n${snippets.join("\n")}\n` : ""}
---

My request:

`;
          apiUserContent = contextBlock + input.trim();
        }
      } catch {
        /* non-fatal — send the message without repo context */
      }
    }

    // The displayed user message in the chat uses the short content;
    // the API call uses the context-enriched content for turn 1.
    const userMsg: ChatMessage = { role: "user", content: displayUserContent };
    const allMessages = [...messages, userMsg];

    const apiMessages: { role: "user" | "assistant"; content: string }[] = [];
    for (let idx = 0; idx < allMessages.length; idx++) {
      const m = allMessages[idx];
      if (idx === allMessages.length - 1 && m.role === "user") {
        apiMessages.push({ role: "user", content: apiUserContent });
      } else {
        apiMessages.push({ role: m.role, content: m.content });
      }
    }

    setMessages(allMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/vibe-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          provider,
          apiKey,
          model,
          baseUrl: provider === "custom" ? baseUrl : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error (HTTP ${res.status}): ${
              err.error || "Request failed"
            }`,
          },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const parsed = JSON.parse(trimmed.slice(6));
            if (parsed.type === "content" && parsed.text) {
              assistantContent += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            /* skip malformed */
          }
        }
      }

      // Stream done — extract any code blocks that were tagged with a
      // file path. Instead of writing them immediately, stage them in
      // `pendingWrites` so the DiffModal can show the diff and the
      // user can approve or reject each file before anything hits
      // disk. Only on approval will we call writeFile().
      const blocks = extractFileBlocks(assistantContent);
      if (blocks.length > 0) {
        const staged: PendingWrite[] = [];
        for (const b of blocks) {
          try {
            const existing = await readFileOrEmpty(b.path);
            staged.push({
              path: b.path,
              oldContent: existing,
              newContent: b.content,
              isNew: existing.length === 0,
            });
          } catch {
            staged.push({
              path: b.path,
              oldContent: "",
              newContent: b.content,
              isNew: true,
            });
          }
        }
        setPendingWrites(staged);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Connection error: ${
            err instanceof Error ? err.message : "Unknown error"
          }. Check that your API key is correct and your network is reachable.`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  /* ── save prompt ── */

  const savePrompt = async () => {
    setSavingPrompt(true);
    try {
      // Save to store; actual Supabase persistence handled by parent flow
      setPrompt(prompt);
    } finally {
      setSavingPrompt(false);
    }
  };

  /* ── file click ── */

  const handleFileClick = async (path: string) => {
    setFileModalPath(path);
    const content = await readFile(path);
    setFileContent(content);
  };

  /* ── open folder ── */

  const handleOpenFolder = async () => {
    setFolderError(null);
    try {
      const name = await openFolderPicker();
      if (!name) return; // user cancelled
      const tree = await getFiles();
      setFiles(tree ?? []);
      setConnected(true);
      setFolderName(name);
    } catch (err) {
      setFolderError(
        err instanceof Error ? err.message : "Couldn't open folder."
      );
      setConnected(false);
    }
  };

  const providers: { key: Provider; label: string }[] = [
    { key: "anthropic", label: "Anthropic" },
    { key: "openai", label: "OpenAI" },
    { key: "gemini", label: "Gemini" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="flex flex-1 min-h-0 border-y border-border overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="w-80 border-r border-border flex flex-col shrink-0 min-h-0">
        <div className="flex-1 overflow-y-auto p-5">
          <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-4">
            {flowMode === "import" ? "Project Context" : "Generated Prompt"}
          </p>

          {generatingPrompt ? (
            <p className="font-body text-small text-muted animate-pulse">
              Generating prompt...
            </p>
          ) : (
            <div className="font-mono text-xs text-muted leading-relaxed whitespace-pre-wrap max-h-[280px] overflow-y-auto">
              {prompt || (flowMode === "import" ? "Open your project folder on the right to get started." : "No prompt generated yet.")}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={generatePrompt}
              className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300"
            >
              Regenerate prompt
            </button>
            <button
              type="button"
              onClick={savePrompt}
              disabled={savingPrompt}
              className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300"
            >
              {savingPrompt ? "Saving..." : "Save prompt"}
            </button>
          </div>

          <div className="mt-8">
            <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-3">
              Provider
            </p>
            <div className="flex flex-col gap-2">
              {providers.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.key}
                    checked={provider === p.key}
                    onChange={() => setProvider(p.key)}
                    className="accent-accent"
                  />
                  <span className="font-body text-small text-foreground">
                    {p.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
              API Key
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-transparent font-mono text-xs text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
            />
          </div>

          <div className="mt-5">
            <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
              Model
            </p>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-transparent font-mono text-xs text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
            />
          </div>

          {provider === "custom" && (
            <div className="mt-5">
              <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
                Base URL
              </p>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full bg-transparent font-mono text-xs text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* top bar — chat title + clear button */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted shrink-0">
              Conversation
            </span>
            <span className="font-body text-[13px] text-foreground truncate">
              {productName ||
                (selectedIdea as { name?: string } | null)?.name ||
                "New project"}
            </span>
          </div>
          <div className="flex items-center gap-5 shrink-0">
            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoing}
                className="font-body text-[11px] uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors disabled:opacity-30"
                title="Undo the last accepted batch of writes"
              >
                {undoing ? "Undoing\u2026" : `Undo (${undoStack.length})`}
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="font-body text-[11px] uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[760px] mx-auto px-8 py-10">
          {messages.length === 0 && (
            <div className="flex items-center justify-center min-h-[60vh] px-4">
              <div className="text-center max-w-[440px]">
                {/* Vibr mark */}
                <div className="mx-auto w-12 h-12 rounded-full border border-border flex items-center justify-center font-heading text-[20px] text-foreground mb-6">
                  V
                </div>
                {!connected ? (
                  <>
                    <p className="font-heading font-light text-[22px] text-foreground mb-3">
                      Connect a project folder to begin.
                    </p>
                    <p className="font-body text-[14px] text-muted leading-relaxed">
                      Vibr writes the files it generates straight to disk on
                      your machine. Click <strong className="text-foreground">Open folder</strong> on the
                      right and grant write access — the conversation
                      unlocks once a folder is connected.
                    </p>
                    <p className="mt-4 font-body text-[12px] text-muted/70 leading-relaxed">
                      Heads up: Chrome won&rsquo;t let you pick Desktop,
                      Documents, or Downloads themselves. Make a subfolder
                      like <code className="font-mono text-foreground">~/Desktop/my-app</code> first
                      and pick that.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-heading font-light text-[22px] text-foreground mb-3">
                      What should we build?
                    </p>
                    <p className="font-body text-[14px] text-muted leading-relaxed">
                      {flowMode === "import"
                        ? "Describe what you want to add, change, or fix in your project. Vibr will edit the files in place."
                        : "Describe what you want to ship. Vibr scaffolds the project, writes the files, and gives you a list of next steps."}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const isLastAssistant =
              !isUser && i === messages.length - 1 && streaming;
            return (
              <div key={i} className="mb-10 first:mt-0">
                {/* role label */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-heading text-[12px] ${
                      isUser
                        ? "bg-foreground/10 text-foreground border border-border"
                        : "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                    }`}
                  >
                    {isUser ? "Y" : "V"}
                  </div>
                  <span className="font-body text-[11px] uppercase tracking-[0.18em] text-muted">
                    {isUser ? "You" : "Vibr"}
                  </span>
                </div>

                {/* content */}
                <div className="pl-[38px]">
                  {isUser ? (
                    <div className="font-body text-[15px] text-foreground/90 leading-[1.7] whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="font-body text-[15px] text-foreground/90 leading-[1.7]">
                      {renderMarkdown(msg.content)}
                      {isLastAssistant && msg.content.length > 0 && (
                        <span className="inline-block w-[7px] h-[15px] bg-foreground/70 align-text-bottom ml-0.5 animate-pulse" />
                      )}
                    </div>
                  )}

                  {!isUser && msg.writes && msg.writes.length > 0 && (
                    <div className="mt-4 border border-border rounded-md bg-[#0a0a0a] divide-y divide-border">
                      <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Files written to disk
                      </div>
                      {msg.writes.map((w) => (
                        <div
                          key={w.path}
                          className="px-3 py-2 flex items-center gap-2 font-mono text-[11px]"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              w.ok ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <span className="text-foreground">{w.path}</span>
                          {!w.ok && w.error && (
                            <span className="text-red-300/80 truncate">
                              — {w.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* "thinking" indicator only when no assistant message has started yet */}
          {streaming &&
            (messages[messages.length - 1]?.role !== "assistant" ||
              messages[messages.length - 1]?.content === "") && (
              <div className="mb-10 pl-[38px] flex items-center gap-2 font-body text-[13px] text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse [animation-delay:300ms]" />
                <span className="ml-1">Vibr is thinking…</span>
              </div>
            )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* input — centered, rounded, Claude-style composer */}
        <div className="border-t border-border px-6 pt-4 pb-5">
          <div className="max-w-[760px] mx-auto">
            <div
              className={`flex gap-2 items-end rounded-2xl border bg-[#0c0c0c] px-4 py-3 transition-colors ${
                !apiKey || !connected
                  ? "border-border/60"
                  : "border-border focus-within:border-foreground/40"
              }`}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  !apiKey
                    ? "Enter an API key on the left to start"
                    : !connected
                      ? "Connect a project folder on the right first"
                      : "Reply to Vibr…"
                }
                disabled={!apiKey || !connected || streaming}
                rows={1}
                className="flex-1 bg-transparent font-body text-[15px] text-foreground placeholder:text-muted/60 outline-none resize-none leading-[1.55] max-h-[260px] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || streaming || !apiKey || !connected}
                className="shrink-0 w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
                aria-label="Send"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center font-body text-[10px] uppercase tracking-[0.18em] text-muted/60">
              Vibr writes files straight to {folderName || "your folder"} ·
              Shift + Enter for newline
            </p>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <GhostButton href="/onboarding/deploy">
            Continue to deploy
          </GhostButton>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-80 border-l border-border flex flex-col shrink-0 min-h-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-[10px] uppercase tracking-wide text-muted">
              Local Files
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-green-500" : "bg-muted/40"
                }`}
              />
              <span className="font-body text-xs text-muted">
                {connected ? folderName || "Connected" : "No folder"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenFolder}
            className="font-body text-xs text-foreground hover:text-accent transition-colors duration-300 underline underline-offset-4 decoration-border"
          >
            {connected ? "Pick a different folder" : "Open folder"}
          </button>
          {!connected && (
            <p className="mt-3 font-body text-[10px] text-muted/80 leading-relaxed">
              Pick a <strong className="text-foreground">project subfolder</strong> like
              <code className="font-mono">~/Desktop/my-app</code>. Chrome
              blocks Desktop, Documents, and Downloads themselves —
              create or choose a folder inside one of them first.
            </p>
          )}
          {folderError && (
            <p className="mt-3 font-body text-[11px] text-red-400 leading-relaxed">
              {folderError}
            </p>
          )}
        </div>

        {/* file tree */}
        <div className="flex-1 overflow-y-auto p-3">
          {files.length > 0 ? (
            <FileTree nodes={files} onFileClick={handleFileClick} />
          ) : (
            <p className="font-body text-xs text-muted px-2 leading-relaxed">
              {connected
                ? "No files loaded. Pick a folder to begin."
                : "Click \u201cOpen folder\u201d to grant the IDE read access to a project on your machine."}
            </p>
          )}
        </div>

        {/* terminal */}
        <div className="border-t border-border">
          <div className="px-3 py-2 flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-muted" />
            <p className="font-body text-[10px] uppercase tracking-wide text-muted">
              Terminal
            </p>
          </div>
          <div
            ref={terminalRef}
            className="h-32 overflow-y-auto px-3 pb-3 font-mono text-xs text-muted leading-relaxed"
          >
            {terminalOutput.length === 0 ? (
              <span className="text-muted/50">No output yet.</span>
            ) : (
              terminalOutput.map((line, i) => (
                <div key={i}>{line}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── DIFF REVIEW MODAL ── */}
      {pendingWrites && pendingWrites.length > 0 && (
        <DiffModal
          writes={pendingWrites}
          onApply={handleApplyWrites}
          onCancel={handleRejectWrites}
        />
      )}

      {/* ── FILE CONTENT MODAL ── */}
      <AnimatePresence>
        {fileModalPath && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
            onClick={() => {
              setFileModalPath(null);
              setFileContent(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-[4px] w-full max-w-3xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <span className="font-mono text-xs text-muted truncate">
                  {fileModalPath}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFileModalPath(null);
                    setFileContent(null);
                  }}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {fileContent === null ? (
                  <p className="font-body text-small text-muted animate-pulse">
                    Loading...
                  </p>
                ) : (
                  <pre className="font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {fileContent}
                  </pre>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
