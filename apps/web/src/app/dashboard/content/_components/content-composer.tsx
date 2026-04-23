"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLATFORMS = ["x", "linkedin", "email", "reddit", "instagram", "tiktok"];

export function ContentComposer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState("x");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/company/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          title: title || null,
          body,
          scheduled_for: scheduledFor || null,
          status: scheduledFor ? "scheduled" : "draft",
        }),
      });
      setTitle("");
      setBody("");
      setScheduledFor("");
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
        className="px-4 py-2 font-body text-xs text-muted hover:text-foreground border border-border rounded-full transition-colors"
      >
        + New post
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border border-border rounded-[4px] p-5 space-y-4 mb-6"
    >
      <div className="flex gap-3">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-background font-body text-sm text-foreground border border-border rounded-[4px] px-3 py-2"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          placeholder="Schedule"
          className="bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 flex-1"
        />
      </div>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <textarea
        placeholder="Write your post..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={6}
        className="w-full bg-transparent font-body text-sm text-foreground border border-border rounded-[4px] p-3 focus:border-foreground outline-none resize-none"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
        >
          {saving ? "Saving..." : scheduledFor ? "Schedule" : "Save draft"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-xs text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
