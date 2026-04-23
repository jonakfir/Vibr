"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DangerZone({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const del = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/company", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Delete failed.");
        return;
      }
      router.push("/dashboard/new");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-red-500/30 rounded-[4px] p-5">
      <p className="font-body text-sm text-foreground mb-2">Delete this company</p>
      <p className="font-body text-xs text-muted mb-4 leading-relaxed">
        All contacts, deals, integrations, revenue rows, expenses, and content are
        permanently removed. This can&rsquo;t be undone. Type the company name to
        confirm.
      </p>
      <input
        type="text"
        placeholder={companyName}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        className="w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-red-400 outline-none py-2 mb-4"
      />
      {error && <p className="font-body text-sm text-red-400 mb-3">{error}</p>}
      <button
        type="button"
        onClick={del}
        disabled={busy || confirmation !== companyName}
        className="px-5 py-2 font-body text-sm text-red-400 border border-red-500/40 rounded-full hover:bg-red-500/10 disabled:opacity-30 transition-colors"
      >
        {busy ? "Deleting..." : "Delete company"}
      </button>
    </div>
  );
}
