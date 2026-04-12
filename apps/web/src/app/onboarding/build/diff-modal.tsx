"use client";

/**
 * Diff review modal — shown after a streamed assistant response
 * contains file blocks. The user sees a per-file diff between the
 * current disk contents and the proposed new contents, ticks which
 * ones to apply, and hits "Apply selected". Only then does vibr
 * actually write anything to disk.
 *
 * This is the trust upgrade — without it, vibr silently overwrites
 * files and a bad model response can corrupt the user's project.
 */

import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { lineDiff, diffStats, type DiffLine } from "./diff";
import { highlight, langFromPath } from "./highlight";

export interface PendingWrite {
  path: string;
  oldContent: string;
  newContent: string;
  isNew: boolean;
}

function DiffView({ path, diff }: { path: string; diff: DiffLine[] }) {
  const lang = langFromPath(path);

  return (
    <pre className="overflow-x-auto font-mono text-[12px] leading-[1.55] bg-[#0a0a0a]">
      <code>
        {diff.map((line, i) => {
          const base =
            line.type === "added"
              ? "diff-add"
              : line.type === "removed"
                ? "diff-remove"
                : "";
          const mark =
            line.type === "added"
              ? "+"
              : line.type === "removed"
                ? "-"
                : " ";
          const markCls =
            line.type === "added"
              ? "diff-add-mark"
              : line.type === "removed"
                ? "diff-remove-mark"
                : "text-muted/50";
          return (
            <div
              key={i}
              className={`flex gap-3 px-4 ${base}`}
            >
              <span className={`w-3 shrink-0 ${markCls}`}>{mark}</span>
              <span
                className="flex-1 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlight(line.text, lang) }}
              />
            </div>
          );
        })}
      </code>
    </pre>
  );
}

export function DiffModal({
  writes,
  onApply,
  onCancel,
}: {
  writes: PendingWrite[];
  onApply: (selectedPaths: string[]) => void;
  onCancel: () => void;
}) {
  // All writes are selected by default — the user can untick files
  // they don't want applied.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(writes.map((w) => w.path))
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(writes.map((w) => w.path))
  );

  // Precompute diffs once per render — cheap for typical sizes.
  const diffs = useMemo(() => {
    const map = new Map<string, DiffLine[]>();
    for (const w of writes) {
      map.set(w.path, lineDiff(w.oldContent, w.newContent));
    }
    return map;
  }, [writes]);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const totals = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const w of writes) {
      const d = diffs.get(w.path);
      if (!d) continue;
      const s = diffStats(d);
      added += s.added;
      removed += s.removed;
    }
    return { added, removed };
  }, [diffs, writes]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border rounded-md w-full max-w-[900px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.18em] text-muted">
              Review changes
            </p>
            <h2 className="mt-1 font-heading font-light text-[22px] text-foreground">
              {writes.length} file{writes.length === 1 ? "" : "s"} proposed
            </h2>
            <p className="mt-1 font-mono text-[12px] text-muted">
              <span className="diff-add-mark">+{totals.added}</span>{" "}
              <span className="diff-remove-mark">-{totals.removed}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff list */}
        <div className="flex-1 overflow-y-auto">
          {writes.map((w) => {
            const diff = diffs.get(w.path) || [];
            const stats = diffStats(diff);
            const isSelected = selected.has(w.path);
            const isExpanded = expanded.has(w.path);
            return (
              <div key={w.path} className="border-b border-border last:border-0">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0d0d0d]">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(w.path)}
                    className="accent-emerald-400 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => toggleExpand(w.path)}
                    className="flex-1 flex items-center gap-2 min-w-0 text-left"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <span
                      className={`font-body text-[11px] uppercase tracking-wide shrink-0 ${
                        w.isNew ? "text-emerald-300" : "text-muted"
                      }`}
                    >
                      {w.isNew ? "New" : "Edit"}
                    </span>
                    <span className="font-mono text-[12px] text-foreground truncate">
                      {w.path}
                    </span>
                    <span className="font-mono text-[11px] shrink-0 ml-auto">
                      <span className="diff-add-mark">+{stats.added}</span>{" "}
                      <span className="diff-remove-mark">-{stats.removed}</span>
                    </span>
                  </button>
                </div>
                {isExpanded && <DiffView path={w.path} diff={diff} />}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          <p className="font-body text-[12px] text-muted">
            {selected.size} of {writes.length} selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="font-body text-[12px] uppercase tracking-[0.15em] border border-border text-muted px-5 py-2.5 hover:border-foreground hover:text-foreground transition-colors"
            >
              Reject all
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => onApply(Array.from(selected))}
              className="font-body text-[12px] uppercase tracking-[0.15em] bg-foreground text-background px-5 py-2.5 hover:bg-foreground/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Apply {selected.size} file{selected.size === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
