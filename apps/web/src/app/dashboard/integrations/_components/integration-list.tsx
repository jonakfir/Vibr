"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plug, CheckCircle2, AlertTriangle } from "lucide-react";

interface Field {
  key: string;
  label: string;
  secret: boolean;
}

interface CatalogItem {
  provider: string;
  name: string;
  description: string;
  fields: Field[];
}

interface ConnectedRow {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
}

export function IntegrationList({
  catalog,
  connected,
  canWrite,
}: {
  catalog: CatalogItem[];
  connected: ConnectedRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byProvider = new Map(connected.map((c) => [c.provider, c]));

  const update = (provider: string, key: string, v: string) => {
    setValues((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] ?? {}), [key]: v },
    }));
  };

  const save = async (provider: string) => {
    setSaving(provider);
    setError(null);
    try {
      const res = await fetch("/api/company/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          secrets: values[provider] ?? {},
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed.");
        return;
      }
      setExpanded(null);
      setValues((prev) => ({ ...prev, [provider]: {} }));
      router.refresh();
    } finally {
      setSaving(null);
    }
  };

  const disconnect = async (provider: string) => {
    if (!confirm(`Disconnect ${provider}? Stored keys will be wiped.`)) return;
    await fetch(`/api/company/integrations?provider=${provider}`, {
      method: "DELETE",
    });
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {catalog.map((item) => {
        const conn = byProvider.get(item.provider);
        const isOpen = expanded === item.provider;
        return (
          <div
            key={item.provider}
            className="border border-border rounded-[4px] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <Plug className="w-4 h-4 text-muted" />
                <div>
                  <p className="font-body text-sm text-foreground">{item.name}</p>
                  <p className="font-body text-xs text-muted">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {conn ? (
                  conn.status === "connected" ? (
                    <span className="inline-flex items-center gap-1.5 font-body text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-body text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> {conn.status}
                    </span>
                  )
                ) : null}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : item.provider)}
                    className="font-body text-xs text-muted hover:text-foreground transition-colors"
                  >
                    {conn ? "Update" : "Connect"}
                  </button>
                )}
                {conn && canWrite && (
                  <button
                    type="button"
                    onClick={() => disconnect(item.provider)}
                    className="font-body text-xs text-muted hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-border px-5 py-5 space-y-4">
                {item.fields.map((field) => (
                  <div key={field.key}>
                    <label className="font-body text-[10px] uppercase tracking-wide text-muted">
                      {field.label}
                    </label>
                    <input
                      type={field.secret ? "password" : "text"}
                      autoComplete="off"
                      value={values[item.provider]?.[field.key] ?? ""}
                      onChange={(e) =>
                        update(item.provider, field.key, e.target.value)
                      }
                      className="mt-2 w-full bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors"
                    />
                  </div>
                ))}
                {error && <p className="font-body text-sm text-red-400">{error}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={saving === item.provider}
                    onClick={() => save(item.provider)}
                    className="px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
                  >
                    {saving === item.provider ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(null)}
                    className="font-body text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
