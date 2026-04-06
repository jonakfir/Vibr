"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface SessionRow {
  id: string;
  step: number;
  selected_idea: any;
  prompt: string | null;
  created_at: string;
}

interface SavedPromptRow {
  id: string;
  idea_name: string | null;
  prompt: string | null;
  created_at: string;
}

interface OutreachRow {
  id: string;
  marketer_name: string | null;
  status: string;
  sent_at: string | null;
}

const STEP_LABELS: Record<number, string> = {
  1: "Profile",
  2: "Ideation",
  3: "Building",
  4: "Launching",
  5: "Complete",
};

function stepLabel(step: number): string {
  if (step >= 5) return "Complete";
  return STEP_LABELS[step] ?? "Profile";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [prompts, setPrompts] = useState<SavedPromptRow[]>([]);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [ideasCount, setIdeasCount] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const [sessionsRes, promptsRes, outreachRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("id, step, selected_idea, prompt, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_prompts")
          .select("id, idea_name, prompt, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("outreach_log")
          .select("id, marketer_name, status, sent_at")
          .eq("user_id", user.id)
          .order("sent_at", { ascending: false }),
      ]);

      const sessionsData = (sessionsRes.data ?? []) as SessionRow[];
      const promptsData = (promptsRes.data ?? []) as SavedPromptRow[];
      const outreachData = (outreachRes.data ?? []) as OutreachRow[];

      setSessions(sessionsData);
      setPrompts(promptsData);
      setOutreach(outreachData);

      // Count ideas across all sessions
      let ideas = 0;
      for (const s of sessionsData) {
        if (s.selected_idea) ideas++;
      }
      setIdeasCount(ideas);
      setOutreachCount(outreachData.length);
      setLoading(false);
    };

    load();
  }, [router]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-small text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-24">
      {/* Heading */}
      <motion.h1
        className="font-heading font-light text-display text-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Dashboard
      </motion.h1>

      {/* Stats */}
      <motion.div
        className="mt-16 flex gap-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div>
          <p className="font-heading font-light text-title text-foreground">
            {ideasCount}
          </p>
          <p className="font-body text-xs uppercase tracking-wide text-muted mt-1">
            Ideas generated
          </p>
        </div>
        <div>
          <p className="font-heading font-light text-title text-foreground">
            {sessions.length}
          </p>
          <p className="font-body text-xs uppercase tracking-wide text-muted mt-1">
            Sessions
          </p>
        </div>
        <div>
          <p className="font-heading font-light text-title text-foreground">
            {outreachCount}
          </p>
          <p className="font-body text-xs uppercase tracking-wide text-muted mt-1">
            Outreach sent
          </p>
        </div>
      </motion.div>

      {/* Recent Sessions */}
      <motion.section
        className="mt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
          Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <p className="font-body text-small text-muted">
            No sessions yet.{" "}
            <Link
              href="/onboarding"
              className="text-foreground hover:underline"
            >
              Start your first session
            </Link>
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Date
                </th>
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Idea
                </th>
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Product
                </th>
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Status
                </th>
                <th className="text-right font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const idea = session.selected_idea as Record<string, string> | null;
                return (
                  <tr key={session.id} className="border-b border-border">
                    <td className="py-4 font-body text-small text-muted">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="py-4 font-heading font-light text-body text-foreground">
                      {idea?.name ?? "—"}
                    </td>
                    <td className="py-4 font-heading font-light text-body text-foreground">
                      {idea?.sector ?? "—"}
                    </td>
                    <td className="py-4">
                      <span className="font-body text-xs uppercase tracking-wide text-muted">
                        {stepLabel(session.step)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/onboarding`}
                        className="font-body text-small text-foreground hover:underline transition-colors duration-300"
                      >
                        Resume &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.section>

      {/* Saved Prompts */}
      <motion.section
        className="mt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
          Saved Prompts
        </h2>

        {prompts.length === 0 ? (
          <p className="font-body text-small text-muted">
            No saved prompts yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {prompts.map((p) => (
              <div
                key={p.id}
                className="bg-card border border-card-border p-6"
              >
                <p className="font-heading font-light text-body text-foreground">
                  {p.idea_name ?? "Untitled"}
                </p>
                <p className="font-body text-small text-muted mt-2 leading-relaxed">
                  {p.prompt ? p.prompt.slice(0, 100) + (p.prompt.length > 100 ? "..." : "") : "—"}
                </p>
                <div className="mt-4 flex gap-6">
                  <button
                    type="button"
                    onClick={() => handleCopy(p.id, p.prompt ?? "")}
                    className="font-body text-small text-foreground hover:underline transition-colors duration-300"
                  >
                    {copied === p.id ? "Copied" : "Copy"}
                  </button>
                  <Link
                    href="/onboarding"
                    className="font-body text-small text-foreground hover:underline transition-colors duration-300"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Outreach Log */}
      <motion.section
        className="mt-24 pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
          Outreach
        </h2>

        {outreach.length === 0 ? (
          <p className="font-body text-small text-muted">
            No outreach sent yet.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Marketer
                </th>
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Date Sent
                </th>
                <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {outreach.map((o) => (
                <tr key={o.id} className="border-b border-border">
                  <td className="py-4 font-heading font-light text-body text-foreground">
                    {o.marketer_name ?? "—"}
                  </td>
                  <td className="py-4 font-body text-small text-muted">
                    {o.sent_at ? formatDate(o.sent_at) : "—"}
                  </td>
                  <td className="py-4">
                    <span className="font-body text-xs uppercase tracking-wide text-muted">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.section>
    </div>
  );
}
