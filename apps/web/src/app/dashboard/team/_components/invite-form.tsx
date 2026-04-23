"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

const ROLES = ["admin", "manager", "member", "viewer"] as const;

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("member");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/company/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invite failed.");
        return;
      }
      setMessage(`Invite sent to ${email}.`);
      setEmail("");
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border border-border rounded-[4px] p-5 flex flex-col md:flex-row gap-3"
    >
      <input
        type="email"
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
        className="bg-background font-body text-sm text-foreground border border-border rounded-[4px] px-3 py-2"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center gap-2 px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
        {sending ? "Sending..." : "Invite"}
      </button>
      {error && (
        <p className="md:ml-4 font-body text-sm text-red-400 self-center">
          {error}
        </p>
      )}
      {message && (
        <p className="md:ml-4 font-body text-sm text-emerald-400 self-center">
          {message}
        </p>
      )}
    </form>
  );
}
