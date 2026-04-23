"use client";

import { formatCents } from "@/components/dashboard/kpi-card";

interface Deal {
  id: string;
  title: string;
  amount_cents: number;
  currency: string;
  stage: string;
}

const STAGES = [
  { key: "new", label: "New" },
  { key: "contact", label: "Contacted" },
  { key: "demo", label: "Demo" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export function DealKanban({ deals }: { deals: Deal[] }) {
  const byStage = new Map<string, Deal[]>();
  STAGES.forEach((s) => byStage.set(s.key, []));
  deals.forEach((d) => byStage.get(d.stage)?.push(d));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAGES.map((s) => {
        const list = byStage.get(s.key) ?? [];
        const total = list.reduce((sum, d) => sum + d.amount_cents, 0);
        return (
          <div
            key={s.key}
            className="border border-border rounded-[4px] p-3 bg-card/20 min-h-[160px]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-[10px] uppercase tracking-wide text-muted">
                {s.label}
              </p>
              <p className="font-body text-[10px] text-muted">
                {formatCents(total)}
              </p>
            </div>
            <div className="space-y-2">
              {list.map((d) => (
                <div
                  key={d.id}
                  className="bg-background border border-border rounded-[4px] p-3"
                >
                  <p className="font-body text-sm text-foreground truncate">
                    {d.title}
                  </p>
                  <p className="font-body text-xs text-muted mt-1">
                    {formatCents(d.amount_cents, d.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
