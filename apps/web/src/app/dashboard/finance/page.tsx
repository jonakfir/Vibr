import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { KpiCard, formatCents } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ExpenseForm } from "./_components/expense-form";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();

  const [{ data: revenue }, { data: expenses }] = await Promise.all([
    supabase
      .from("company_revenue")
      .select("*")
      .eq("company_id", company.id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase
      .from("company_expenses")
      .select("*")
      .eq("company_id", company.id)
      .order("occurred_on", { ascending: false })
      .limit(50),
  ]);

  const moneyIn = (revenue ?? [])
    .filter((r) => r.kind === "payment")
    .reduce((s, r) => s + r.amount_cents, 0);
  const refunds = (revenue ?? [])
    .filter((r) => r.kind === "refund")
    .reduce((s, r) => s + Math.abs(r.amount_cents), 0);
  const moneyOut = (expenses ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const net = moneyIn - refunds - moneyOut;

  const canWrite = role === "owner" || role === "admin" || role === "manager";

  return (
    <div className="p-10 max-w-[1100px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-10">
        Finance
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Revenue" value={formatCents(moneyIn)} deltaDirection="up" />
        <KpiCard label="Refunds" value={formatCents(refunds)} />
        <KpiCard label="Expenses" value={formatCents(moneyOut)} deltaDirection="down" />
        <KpiCard
          label="Net"
          value={formatCents(net)}
          deltaDirection={net >= 0 ? "up" : "down"}
        />
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-light text-xl text-foreground">
            Money in
          </h2>
          <p className="font-body text-xs text-muted">
            Populated by the Stripe webhook. Connect Stripe in{" "}
            <a href="/dashboard/integrations" className="underline">
              Integrations
            </a>
            .
          </p>
        </div>
        {!revenue || revenue.length === 0 ? (
          <EmptyState
            title="No revenue yet"
            description="Once Stripe is connected, payments, refunds, and payouts land here in real time."
            ctaLabel="Connect Stripe"
            ctaHref="/dashboard/integrations"
          />
        ) : (
          <table className="w-full border border-border rounded-[4px] overflow-hidden">
            <thead className="bg-card/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Date</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Kind</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Source</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {revenue.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-body text-sm text-foreground">
                    {new Date(r.occurred_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted">{r.kind}</td>
                  <td className="px-4 py-3 font-body text-sm text-muted">{r.source}</td>
                  <td className="px-4 py-3 font-body text-sm text-foreground text-right">
                    {formatCents(r.amount_cents, r.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-light text-xl text-foreground">
            Money out
          </h2>
        </div>
        {canWrite && <ExpenseForm />}
        {!expenses || expenses.length === 0 ? (
          <EmptyState
            title="No expenses logged"
            description="Track software, contractors, ads, and anything else that eats into margin."
          />
        ) : (
          <table className="w-full border border-border rounded-[4px] overflow-hidden mt-4">
            <thead className="bg-card/30">
              <tr className="text-left">
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Date</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Vendor</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted">Category</th>
                <th className="px-4 py-3 font-body text-[10px] uppercase tracking-wide text-muted text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 font-body text-sm text-foreground">
                    {new Date(e.occurred_on).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-foreground">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3 font-body text-sm text-muted">{e.category ?? "—"}</td>
                  <td className="px-4 py-3 font-body text-sm text-foreground text-right">
                    {formatCents(e.amount_cents, e.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
