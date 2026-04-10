"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { GhostButton } from "@/components/ui/ghost-button";
import { MarketerCard } from "@/components/ui/marketer-card";
import { useStore } from "@/lib/store";

/* ─── types ─── */

interface MarketerResult {
  name: string;
  headline: string;
  photo: string;
  linkedin_url: string;
  match_percent: number;
  email_guess: string;
}

interface OutreachDraft {
  subject: string;
  body: string;
  generating: boolean;
  generated: boolean;
}

/* ─── page ─── */

export default function LaunchPage() {
  const router = useRouter();
  const selectedIdea = useStore((s) => s.selectedIdea);
  const productName = useStore((s) => s.productName);

  const [marketers, setMarketers] = useState<MarketerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [drafts, setDrafts] = useState<Record<number, OutreachDraft>>({});
  const [expandedDrafts, setExpandedDrafts] = useState<Set<number>>(new Set());

  /* ── fetch marketers ── */

  const fetchMarketers = useCallback(async () => {
    if (!selectedIdea || !productName) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/find-marketers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: selectedIdea,
          sector: selectedIdea.sector,
          product_name: productName,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMarketers(data.marketers || []);
      }
    } catch {
      setError("Failed to find marketers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedIdea, productName]);

  useEffect(() => {
    fetchMarketers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── toggle selection ── */

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /* ── toggle draft expand ── */

  const toggleExpand = (index: number) => {
    setExpandedDrafts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /* ── generate outreach ── */

  const generateOutreach = async (index: number) => {
    const marketer = marketers[index];
    if (!marketer || !selectedIdea || !productName) return;

    setDrafts((prev) => ({
      ...prev,
      [index]: { subject: "", body: "", generating: true, generated: false },
    }));

    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketer: { name: marketer.name, headline: marketer.headline },
          product_name: productName,
          idea: selectedIdea,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setDrafts((prev) => ({
          ...prev,
          [index]: {
            subject: "",
            body: `Error: ${data.error}`,
            generating: false,
            generated: true,
          },
        }));
      } else {
        setDrafts((prev) => ({
          ...prev,
          [index]: {
            subject: data.subject || "",
            body: data.body || "",
            generating: false,
            generated: true,
          },
        }));
      }
    } catch {
      setDrafts((prev) => ({
        ...prev,
        [index]: {
          subject: "",
          body: "Failed to generate email. Please try again.",
          generating: false,
          generated: true,
        },
      }));
    }
  };

  /* ── update draft fields ── */

  const updateDraft = (
    index: number,
    field: "subject" | "body",
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: value },
    }));
  };

  /* ── send outreach ── */

  const sendOutreach = async (index: number) => {
    const draft = drafts[index];
    const marketer = marketers[index];
    if (!draft || !marketer) return;

    // Log to outreach_log (in a full implementation this would POST to an API)
    console.log("Outreach sent:", {
      marketer: marketer.name,
      email: marketer.email_guess,
      subject: draft.subject,
      body: draft.body,
    });

    setDrafts((prev) => ({
      ...prev,
      [index]: { ...prev[index], body: prev[index].body + "\n\n[Sent]" },
    }));
  };

  /* ── selected marketers list ── */

  const selectedMarketers = Array.from(selected).sort((a, b) => a - b);

  return (
    <div className="max-w-[1200px] mx-auto py-16 px-6">
      {/* heading */}
      <motion.h1
        className="font-heading font-light text-title text-foreground mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Find your growth partner.
      </motion.h1>
      <motion.p
        className="font-body font-light text-body-lg text-muted mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        We&rsquo;ll match you with marketers who specialize in your
        product&rsquo;s sector.
      </motion.p>

      {/* loading state */}
      {loading && (
        <motion.p
          className="font-body text-body text-muted"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Scanning LinkedIn...
        </motion.p>
      )}

      {/* error */}
      {error && !loading && (
        <div className="mb-8">
          <p className="font-body text-small text-red-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={fetchMarketers}
            className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* marketer grid */}
      {!loading && marketers.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {marketers.map((m, i) => (
            <MarketerCard
              key={`${m.name}-${i}`}
              name={m.name}
              photo={m.photo || "/placeholder-avatar.png"}
              headline={m.headline}
              matchPercent={m.match_percent}
              onSelect={() => toggleSelect(i)}
              className={
                selected.has(i)
                  ? "border-accent"
                  : undefined
              }
            />
          ))}
        </motion.div>
      )}

      {/* draft outreach section */}
      {selectedMarketers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-16"
        >
          <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-6">
            Draft Outreach
          </p>

          <div className="space-y-4">
            {selectedMarketers.map((idx) => {
              const marketer = marketers[idx];
              const draft = drafts[idx];
              const isExpanded = expandedDrafts.has(idx);

              return (
                <div
                  key={idx}
                  className="border border-border rounded-[4px] overflow-hidden"
                >
                  {/* header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-card/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted" />
                      )}
                      <span className="font-body text-small text-foreground">
                        {marketer.name}
                      </span>
                      <span className="font-body text-xs text-muted">
                        {marketer.email_guess}
                      </span>
                    </div>
                    {draft?.generated && (
                      <span className="font-body text-[10px] uppercase tracking-wide text-accent">
                        Draft ready
                      </span>
                    )}
                  </button>

                  {/* expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-border pt-4">
                          {!draft?.generated && (
                            <button
                              type="button"
                              onClick={() => generateOutreach(idx)}
                              disabled={draft?.generating}
                              className="font-body text-xs text-muted hover:text-foreground disabled:opacity-30 transition-colors duration-300 group"
                            >
                              {draft?.generating ? (
                                <span className="animate-pulse">
                                  Generating...
                                </span>
                              ) : (
                                <span>
                                  Generate email{" "}
                                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                                    &rarr;
                                  </span>
                                </span>
                              )}
                            </button>
                          )}

                          {draft?.generated && (
                            <div className="space-y-4">
                              <div>
                                <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
                                  Subject
                                </p>
                                <input
                                  type="text"
                                  value={draft.subject}
                                  onChange={(e) =>
                                    updateDraft(idx, "subject", e.target.value)
                                  }
                                  className="w-full bg-transparent font-body text-small text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
                                />
                              </div>
                              <div>
                                <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
                                  Body
                                </p>
                                <textarea
                                  value={draft.body}
                                  onChange={(e) =>
                                    updateDraft(idx, "body", e.target.value)
                                  }
                                  rows={8}
                                  className="w-full bg-transparent font-body text-small text-foreground border border-border rounded-[4px] p-3 focus:border-foreground outline-none resize-none transition-colors duration-300"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => sendOutreach(idx)}
                                className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300 group"
                              >
                                Send{" "}
                                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                                  &rarr;
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* bottom nav */}
      <div className="flex justify-end pt-8 border-t border-border">
        <GhostButton href="/dashboard">Go to dashboard</GhostButton>
      </div>
    </div>
  );
}
