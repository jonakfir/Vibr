import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { IntegrationList } from "./_components/integration-list";

export const dynamic = "force-dynamic";

const CATALOG = [
  {
    provider: "stripe" as const,
    name: "Stripe",
    description: "Payments, subscriptions, payouts. Ingested via webhook.",
    fields: [
      { key: "secret_key", label: "Secret key (sk_live_…)", secret: true },
      { key: "webhook_secret", label: "Webhook secret (whsec_…)", secret: true },
    ],
  },
  {
    provider: "resend" as const,
    name: "Resend",
    description: "Transactional email for invites and notifications.",
    fields: [{ key: "api_key", label: "API key (re_…)", secret: true }],
  },
  {
    provider: "google" as const,
    name: "Google",
    description: "Workspace / Analytics access via service account JSON.",
    fields: [{ key: "service_account_json", label: "Service account JSON", secret: true }],
  },
  {
    provider: "supabase" as const,
    name: "Supabase",
    description: "Connect a project for your product's own data plane.",
    fields: [
      { key: "project_url", label: "Project URL", secret: false },
      { key: "service_role_key", label: "Service role key", secret: true },
    ],
  },
  {
    provider: "custom" as const,
    name: "Custom",
    description: "Any other API. Store one or more opaque key/value pairs.",
    fields: [
      { key: "label", label: "Label", secret: false },
      { key: "value", label: "Value", secret: true },
    ],
  },
];

export default async function IntegrationsPage() {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_integrations")
    .select("id, provider, status, last_sync_at, metadata")
    .eq("company_id", company.id);

  return (
    <div className="p-10 max-w-[900px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-3">
        Integrations
      </h1>
      <p className="font-body text-sm text-muted mb-10 leading-relaxed">
        Paste your provider keys. They&rsquo;re encrypted at rest with AES-256-GCM
        before we save them — nobody but this app can read them.
      </p>
      <IntegrationList
        catalog={CATALOG}
        connected={data ?? []}
        canWrite={role === "owner" || role === "admin" || role === "manager"}
      />
    </div>
  );
}
