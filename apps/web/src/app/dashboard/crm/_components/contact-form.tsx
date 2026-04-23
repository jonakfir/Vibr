"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function ContactForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState("lead");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/company/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || null, stage, source: "manual" }),
      });
      setName("");
      setEmail("");
      setStage("lead");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 font-body text-xs text-muted hover:text-foreground border border-border rounded-full transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add contact
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="bg-background border border-border rounded-[4px] p-6 w-full max-w-[420px] space-y-4">
        <h3 className="font-heading font-light text-xl text-foreground">New contact</h3>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="w-full bg-background font-body text-sm text-foreground border border-border rounded-[4px] px-3 py-2"
        >
          <option value="lead">Lead</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-body text-xs text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
