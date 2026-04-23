"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNameChange = (v: string) => {
    setName(v);
    setSlug(
      v
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create company.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[520px] mx-auto py-20 px-6">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-heading font-light text-4xl text-foreground mb-3"
      >
        Create your company
      </motion.h1>
      <p className="font-body text-sm text-muted mb-10 leading-relaxed">
        This becomes your tenant. Everything — CRM, finance, team, integrations
        — is scoped to it.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="font-body text-[10px] uppercase tracking-wide text-muted">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Acme Co"
            required
            className="mt-2 w-full bg-transparent font-body text-base text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors"
          />
        </div>
        <div>
          <label className="font-body text-[10px] uppercase tracking-wide text-muted">
            URL slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="acme-co"
            required
            className="mt-2 w-full bg-transparent font-body text-base text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors"
          />
          <p className="mt-1 font-body text-xs text-muted">
            Used in links and invite emails.
          </p>
        </div>

        {error && <p className="font-body text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !name || !slug}
          className="px-6 py-2.5 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors duration-300"
        >
          {submitting ? "Creating..." : "Create company →"}
        </button>
      </form>
    </div>
  );
}
