"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus } from "lucide-react";
import type { Company, CompanyRole } from "@/lib/dashboard/types";

interface Props {
  active: { company: Company; role: CompanyRole } | null;
  all: { company: Company; role: CompanyRole }[];
}

export function WorkspaceSwitcher({ active, all }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const activate = async (id: string) => {
    setSwitching(id);
    try {
      await fetch("/api/company/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: id }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-[4px] hover:border-foreground/60 transition-colors duration-300"
      >
        <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center">
          <span className="font-heading text-xs text-foreground">
            {active ? active.company.name.charAt(0).toUpperCase() : "·"}
          </span>
        </div>
        <span className="font-body text-sm text-foreground">
          {active ? active.company.name : "No company"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 bg-background border border-border rounded-[4px] shadow-lg z-50 overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="max-h-64 overflow-y-auto">
            {all.length === 0 && (
              <p className="px-4 py-3 font-body text-xs text-muted">
                No companies yet.
              </p>
            )}
            {all.map(({ company, role }) => {
              const isActive = active?.company.id === company.id;
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => activate(company.id)}
                  disabled={switching === company.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-card/60 transition-colors duration-200 disabled:opacity-40"
                >
                  <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                    <span className="font-heading text-xs text-foreground">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">
                      {company.name}
                    </p>
                    <p className="font-body text-[10px] uppercase tracking-wide text-muted">
                      {role}
                    </p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-accent" />}
                </button>
              );
            })}
          </div>
          <a
            href="/dashboard/new"
            className="flex items-center gap-2 px-4 py-3 border-t border-border font-body text-sm text-muted hover:text-foreground transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            New company
          </a>
        </div>
      )}
    </div>
  );
}
