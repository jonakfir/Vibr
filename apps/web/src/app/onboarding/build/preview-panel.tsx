"use client";

/**
 * Live preview pane for the build IDE.
 *
 * Wraps the WebContainer singleton in webcontainer.ts with a UI: a
 * "Start preview" button, a status row, an iframe showing the dev
 * server, and a collapsible terminal at the bottom.
 *
 * This component is rendered inside the right column of the build
 * page so the user can toggle between the file tree and the live
 * preview without leaving the IDE.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RefreshCw, Square, Terminal as TerminalIcon, Play } from "lucide-react";
import {
  getSnapshot,
  getServerSnapshot,
  restartDev,
  startPreview,
  stopPreview,
  subscribe,
} from "./webcontainer";

/** The preview panel asks the host page for the current list of
 *  files to boot the sandbox with, via this callback. The host page
 *  knows how to walk the connected File System Access handle — we
 *  don't. */
export function PreviewPanel({
  getFilesForBoot,
}: {
  getFilesForBoot: () => Promise<{ path: string; content: string }[]>;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [booting, setBooting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Keep the terminal auto-scrolled to the bottom.
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [snapshot.terminal]);

  const handleStart = useCallback(async () => {
    setBooting(true);
    try {
      const files = await getFilesForBoot();
      await startPreview(files);
    } finally {
      setBooting(false);
    }
  }, [getFilesForBoot]);

  const handleStop = useCallback(async () => {
    await stopPreview();
  }, []);

  const handleRestart = useCallback(async () => {
    await restartDev();
  }, []);

  const status = snapshot.status;
  const statusMessage = snapshot.statusMessage;
  const previewUrl = snapshot.previewUrl;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Status + controls */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              status === "ready"
                ? "bg-emerald-400"
                : status === "error"
                  ? "bg-red-400"
                  : status === "idle"
                    ? "bg-muted/40"
                    : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="font-body text-[11px] uppercase tracking-[0.15em] text-muted truncate">
            {status === "idle" && "Preview"}
            {status === "booting" && "Booting sandbox"}
            {status === "mounting" && "Copying files"}
            {status === "installing" && "npm install"}
            {status === "running" && "Starting dev server"}
            {status === "ready" && "Live"}
            {status === "error" && "Error"}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === "idle" && (
            <button
              type="button"
              onClick={handleStart}
              disabled={booting}
              className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.15em] text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-40"
            >
              <Play className="w-3 h-3" />
              {booting ? "Starting\u2026" : "Start"}
            </button>
          )}
          {(status === "ready" || status === "running") && (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
                title="Restart the dev server"
              >
                <RefreshCw className="w-3 h-3" />
                Restart
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.15em] text-muted hover:text-red-300 transition-colors"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            </>
          )}
          {status === "error" && (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 font-body text-[11px] uppercase tracking-[0.15em] text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <Play className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Preview iframe or empty state */}
      <div className="flex-1 min-h-0 bg-[#0a0a0a] relative">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {status === "idle" ? (
              <div className="text-center max-w-[280px]">
                <p className="font-body text-[13px] text-foreground mb-2">
                  Live preview
                </p>
                <p className="font-body text-[11px] text-muted leading-relaxed">
                  Click <strong className="text-foreground">Start</strong> to boot an in-browser Node sandbox, install dependencies, and run your dev server here.
                </p>
              </div>
            ) : status === "error" ? (
              <div className="text-center max-w-[300px]">
                <p className="font-body text-[12px] text-red-300 mb-2">
                  Preview error
                </p>
                <p className="font-body text-[11px] text-muted leading-relaxed whitespace-pre-wrap">
                  {statusMessage}
                </p>
              </div>
            ) : (
              <div className="text-center max-w-[280px]">
                <p className="font-body text-[11px] text-muted animate-pulse">
                  {statusMessage || `${status}\u2026`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Terminal */}
      <div className="border-t border-border">
        <button
          type="button"
          onClick={() => setTerminalOpen((v) => !v)}
          className="w-full px-3 py-2 flex items-center gap-1.5 hover:bg-white/[0.02] transition-colors"
        >
          <TerminalIcon className="w-3 h-3 text-muted" />
          <span className="font-body text-[10px] uppercase tracking-wider text-muted">
            Terminal ({snapshot.terminal.length})
          </span>
          <span className="ml-auto font-body text-[10px] text-muted/60">
            {terminalOpen ? "hide" : "show"}
          </span>
        </button>
        {terminalOpen && (
          <div
            ref={terminalRef}
            className="h-40 overflow-y-auto px-3 pb-3 font-mono text-[11px] text-muted leading-relaxed bg-[#0a0a0a]"
          >
            {snapshot.terminal.length === 0 ? (
              <span className="text-muted/50">No output yet.</span>
            ) : (
              snapshot.terminal.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
