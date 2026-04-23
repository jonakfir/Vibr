"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function ExpenseForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [occurred, setOccurred] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      await fetch("/api/company/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents: cents,
          vendor,
          category,
          occurred_on: occurred,
        }),
      });
      setAmount("");
      setVendor("");
      setCategory("");
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
        Log expense
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border border-border rounded-[4px] p-5 grid grid-cols-1 md:grid-cols-4 gap-4"
    >
      <input
        type="number"
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <input
        type="text"
        placeholder="Vendor"
        value={vendor}
        onChange={(e) => setVendor(e.target.value)}
        className="bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <input
        type="date"
        value={occurred}
        onChange={(e) => setOccurred(e.target.value)}
        className="bg-transparent font-body text-sm text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2"
      />
      <div className="md:col-span-4 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground disabled:opacity-30 transition-colors"
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
    </form>
  );
}
