interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  hint?: string;
}

export function KpiCard({ label, value, delta, deltaDirection = "flat", hint }: KpiCardProps) {
  const color =
    deltaDirection === "up"
      ? "text-emerald-400"
      : deltaDirection === "down"
        ? "text-red-400"
        : "text-muted";
  return (
    <div className="border border-border rounded-[4px] p-5 bg-card/30">
      <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-3">
        {label}
      </p>
      <p className="font-heading font-light text-3xl text-foreground">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        {delta && (
          <span className={`font-body text-xs ${color}`}>
            {deltaDirection === "up" ? "▲" : deltaDirection === "down" ? "▼" : "—"} {delta}
          </span>
        )}
        {hint && <span className="font-body text-xs text-muted">{hint}</span>}
      </div>
    </div>
  );
}

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
