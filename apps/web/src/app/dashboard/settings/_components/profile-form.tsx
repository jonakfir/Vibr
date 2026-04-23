"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompanyProfileForm({
  initialName,
  initialSlug,
  disabled,
}: {
  initialName: string;
  initialSlug: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) {
        setMessage("Saved.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="font-body text-[10px] uppercase tracking-wide text-muted">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className="mt-2 w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="font-body text-[10px] uppercase tracking-wide text-muted">
          Slug
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          disabled={disabled}
          className="mt-2 w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 disabled:opacity-50"
        />
      </div>
      {!disabled && (
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {message && (
            <span className="font-body text-xs text-muted">{message}</span>
          )}
        </div>
      )}
    </form>
  );
}
