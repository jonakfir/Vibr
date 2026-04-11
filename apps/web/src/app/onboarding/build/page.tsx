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
  openFolderPicker,
  connectTerminal,
  type FileNode,
} from "@/lib/vibr-local";

/* ─── types ─── */

type Provider = "anthropic" | "openai" | "gemini" | "custom";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  custom: "gpt-4o",
};

/* ─── tiny markdown renderer ─── */

function renderMarkdown(text: string) {
  const blocks = text.split(/```(\w*)\n([\s\S]*?)```/g);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    if (i % 3 === 0) {
      // prose
      const lines = blocks[i].split("\n");
      const parsed = lines.map((line, li) => {
        let html = line
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/`([^`]+)`/g, '<code class="bg-[#0a0a0a] px-1 py-0.5 text-xs font-mono border border-border rounded">$1</code>');

        if (/^[-*]\s/.test(line)) {
          html = `<span class="ml-4 block">&bull; ${html.slice(2)}</span>`;
        }

        return (
          <span key={`${i}-${li}`} dangerouslySetInnerHTML={{ __html: html }} />
        );
      });
      elements.push(
        <span key={`block-${i}`}>
          {parsed.map((p, pi) => (
            <span key={pi}>
              {p}
              {pi < parsed.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    } else if (i % 3 === 1) {
      // language tag — skip
    } else {
      // code content
      elements.push(
        <pre
          key={`code-${i}`}
          className="bg-[#0a0a0a] border border-border rounded p-3 my-2 overflow-x-auto font-mono text-xs leading-relaxed"
        >
          <code>{blocks[i]}</code>
        </pre>
      );
    }
  }

  return <>{elements}</>;
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
  const [input, setInput] = useState("");
  const [inputPrefilled, setInputPrefilled] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* right panel */
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
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

  useEffect(() => {
    if (flowMode === "import") {
      // For import mode, set a contextual prompt if user provided a description
      if (!prompt && projectDescription) {
        setPrompt(`Project: ${productName}\n\nDescription: ${projectDescription}\n\nConnect vibr-local and open your project folder to get started. You can ask the AI to analyze your codebase, add features, fix bugs, or refactor code.`);
      }
    } else {
      if (!prompt) generatePrompt();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];

    // The first message in the conversation is now pre-filled with the
    // generated starter prompt itself, so we don't need to prepend it
    // again. Just send the conversation as-is.
    const apiMessages = allMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
    await openFolderPicker();
    const tree = await getFiles();
    if (tree) setFiles(tree);
  };

  const providers: { key: Provider; label: string }[] = [
    { key: "anthropic", label: "Anthropic" },
    { key: "openai", label: "OpenAI" },
    { key: "gemini", label: "Gemini" },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] border border-border rounded-[4px] overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="font-body text-small text-muted">
                {flowMode === "import"
                  ? "Describe what you want to add, change, or fix in your project."
                  : "Start coding by describing what you want to build."}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  msg.role === "user"
                    ? "max-w-[80%] bg-card border border-card-border rounded-[4px] px-4 py-3"
                    : "max-w-[80%]"
                }
              >
                <div className="font-body text-small text-foreground leading-relaxed">
                  {msg.role === "assistant"
                    ? renderMarkdown(msg.content)
                    : msg.content}
                </div>
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start">
              <span className="font-body text-small text-muted animate-pulse">
                ...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* input */}
        <div className="border-t border-border p-4 flex gap-3 items-end">
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
              apiKey
                ? "Describe what you want to build..."
                : "Enter an API key to start"
            }
            disabled={!apiKey || streaming}
            rows={2}
            className="flex-1 bg-transparent font-body text-small text-foreground border-0 border-b border-border focus:border-foreground outline-none resize-none py-2 transition-colors duration-300"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || streaming || !apiKey}
            className="font-body text-xs text-muted hover:text-foreground disabled:opacity-30 transition-colors duration-300 pb-2"
          >
            Send
          </button>
        </div>

        {/* bottom bar */}
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <GhostButton href="/onboarding/deploy">
            Continue to deploy
          </GhostButton>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-80 border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-[10px] uppercase tracking-wide text-muted">
              Local Files
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="font-body text-xs text-muted">
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenFolder}
            className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300"
          >
            Open folder
          </button>
        </div>

        {/* file tree */}
        <div className="flex-1 overflow-y-auto p-3">
          {files.length > 0 ? (
            <FileTree nodes={files} onFileClick={handleFileClick} />
          ) : (
            <p className="font-body text-xs text-muted px-2">
              {connected
                ? "No files loaded. Open a folder to begin."
                : "Connect vibr-local to browse files."}
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
