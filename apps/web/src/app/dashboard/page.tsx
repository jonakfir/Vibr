import Link from "next/link";
import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { KpiCard, formatCents } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();

  const [
    { data: revenue },
    { data: expenses },
    { data: contacts },
    { data: deals },
    { data: members },
    { data: audit },
  ] = await Promise.all([
    supabase
      .from("company_revenue")
      .select("amount_cents, kind, occurred_at")
      .eq("company_id", company.id)
      .gte(
        "occurred_at",
        new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      ),
    supabase
      .from("company_expenses")
      .select("amount_cents, occurred_on")
      .eq("company_id", company.id)
      .gte(
        "occurred_on",
        new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)
      ),
    supabase
      .from("company_contacts")
      .select("id", { count: "exact", head: false })
      .eq("company_id", company.id),
    supabase
      .from("company_deals")
      .select("amount_cents, stage")
      .eq("company_id", company.id),
    supabase
      .from("company_members")
      .select("user_id")
      .eq("company_id", company.id),
    supabase
      .from("company_audit_log")
      .select("action, payload, created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const moneyIn = (revenue ?? [])
    .filter((r) => r.kind === "payment")
    .reduce((s, r) => s + r.amount_cents, 0);
  const moneyOut = (expenses ?? []).reduce((s, r) => s + r.amount_cents, 0);
  const pipelineValue = (deals ?? [])
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((s, d) => s + d.amount_cents, 0);
  const won = (deals ?? []).filter((d) => d.stage === "won").length;

  return (
    <div className="p-10 max-w-[1200px]">
      <div className="mb-10">
        <p className="font-body text-xs uppercase tracking-[0.2em] text-muted mb-2">
          {role}
        </p>
        <h1 className="font-heading font-light text-4xl text-foreground">
          {company.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Revenue · 30d"
          value={formatCents(moneyIn)}
          hint={`${(revenue ?? []).filter((r) => r.kind === "payment").length} payments`}
        />
        <KpiCard
          label="Expenses · 30d"
          value={formatCents(moneyOut)}
          hint={`${expenses?.length ?? 0} entries`}
        />
        <KpiCard
          label="Pipeline"
          value={formatCents(pipelineValue)}
          hint={`${won} won`}
        />
        <KpiCard
          label="Team"
          value={String(members?.length ?? 0)}
          hint="members"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <div className="border border-border rounded-[4px] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-xs uppercase tracking-wide text-muted">
              Contacts
            </p>
            <Link
              href="/dashboard/crm"
              className="font-body text-xs text-muted hover:text-foreground transition-colors"
            >
              Open CRM →
            </Link>
          </div>
          <p className="font-heading font-light text-3xl text-foreground">
            {contacts?.length ?? 0}
          </p>
          <p className="font-body text-xs text-muted mt-1">total contacts</p>
        </div>

        <div className="border border-border rounded-[4px] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-xs uppercase tracking-wide text-muted">
              Finance
            </p>
            <Link
              href="/dashboard/finance"
              className="font-body text-xs text-muted hover:text-foreground transition-colors"
            >
              Open ledger →
            </Link>
          </div>
          <p className="font-heading font-light text-3xl text-foreground">
            {formatCents(moneyIn - moneyOut)}
          </p>
          <p className="font-body text-xs text-muted mt-1">net · 30 days</p>
        </div>
      </div>

      <div>
        <p className="font-body text-xs uppercase tracking-wide text-muted mb-4">
          Recent activity
        </p>
        {!audit || audit.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Actions like creating contacts, saving integrations, and ingesting Stripe events will appear here."
          />
        ) : (
          <ul className="divide-y divide-border border border-border rounded-[4px]">
            {audit.map((a, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between">
                <span className="font-body text-sm text-foreground">
                  {a.action}
                </span>
                <span className="font-body text-xs text-muted">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
