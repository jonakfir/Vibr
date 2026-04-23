import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ContactForm } from "./_components/contact-form";
import { DealKanban } from "./_components/deal-kanban";

export const dynamic = "force-dynamic";

const STAGES: { key: string; label: string }[] = [
  { key: "lead", label: "Leads" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default async function CrmPage() {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();

  const [{ data: contacts }, { data: deals }] = await Promise.all([
    supabase
      .from("company_contacts")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_deals")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false }),
  ]);

  const canWrite = role === "owner" || role === "admin" || role === "manager";
  const byStage = new Map<string, any[]>();
  STAGES.forEach((s) => byStage.set(s.key, []));
  (contacts ?? []).forEach((c) => {
    byStage.get(c.stage)?.push(c);
  });

  return (
    <div className="p-10 max-w-[1200px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-3">CRM</h1>
      <p className="font-body text-sm text-muted mb-10">
        Contacts and deal pipeline for {company.name}.
      </p>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-light text-xl text-foreground">
            Deal pipeline
          </h2>
        </div>
        {!deals || deals.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Deals track revenue opportunities: one row per prospect, moving through stages until closed."
          />
        ) : (
          <DealKanban deals={deals} />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-light text-xl text-foreground">
            Contacts
          </h2>
          {canWrite && <ContactForm />}
        </div>
        {!contacts || contacts.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            description="When you draft outreach from Find Marketers, the recipients are logged here automatically."
            ctaLabel="Find marketers"
            ctaHref="/find-marketers"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map((s) => (
              <div key={s.key} className="border border-border rounded-[4px] p-3 min-h-[200px]">
                <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-3">
                  {s.label} · {byStage.get(s.key)?.length ?? 0}
                </p>
                <div className="space-y-2">
                  {(byStage.get(s.key) ?? []).map((c) => (
                    <div
                      key={c.id}
                      className="bg-card/30 border border-border rounded-[4px] p-3"
                    >
                      <p className="font-body text-sm text-foreground">{c.name}</p>
                      {c.email && (
                        <p className="font-body text-xs text-muted mt-1 truncate">
                          {c.email}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
