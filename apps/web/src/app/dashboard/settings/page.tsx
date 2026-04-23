import { requireActiveCompany } from "@/lib/dashboard/company";
import { canManageTeam } from "@/lib/dashboard/types";
import { CompanyProfileForm } from "./_components/profile-form";
import { DangerZone } from "./_components/danger-zone";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { company, role } = await requireActiveCompany();
  const canManage = canManageTeam(role);

  return (
    <div className="p-10 max-w-[720px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-3">
        Settings
      </h1>
      <p className="font-body text-sm text-muted mb-10">
        Company profile, billing, and destructive actions.
      </p>

      <section className="mb-12">
        <h2 className="font-heading font-light text-xl text-foreground mb-4">
          Company profile
        </h2>
        <CompanyProfileForm
          initialName={company.name}
          initialSlug={company.slug}
          disabled={!canManage}
        />
      </section>

      <section className="mb-12">
        <h2 className="font-heading font-light text-xl text-foreground mb-4">
          Billing
        </h2>
        <div className="border border-border rounded-[4px] p-5">
          <p className="font-body text-sm text-foreground mb-2">Vibr Pro</p>
          <p className="font-body text-xs text-muted mb-4">
            Dashboard features (CRM, finance ingest, content pipeline) are included in
            Pro. Manage your subscription on the pricing page.
          </p>
          <a
            href="/pricing"
            className="font-body text-xs text-muted hover:text-foreground transition-colors"
          >
            Manage subscription →
          </a>
        </div>
      </section>

      {role === "owner" && (
        <section>
          <h2 className="font-heading font-light text-xl text-red-400 mb-4">
            Danger zone
          </h2>
          <DangerZone companyName={company.name} />
        </section>
      )}
    </div>
  );
}
