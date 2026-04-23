import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { canManageTeam } from "@/lib/dashboard/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InviteForm } from "./_components/invite-form";
import { MemberRow } from "./_components/member-row";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();

  // auth.users isn't exposed via RLS; we fetch members via an RPC view.
  // For v1 we just show user_id + role; future: join via a public `profiles` view.
  const { data: members } = await supabase
    .from("company_members")
    .select("user_id, role, invited_at, accepted_at")
    .eq("company_id", company.id)
    .order("invited_at");

  const canManage = canManageTeam(role);

  return (
    <div className="p-10 max-w-[900px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-3">Team</h1>
      <p className="font-body text-sm text-muted mb-10">
        Invite teammates and assign roles. Roles gate who can move money, store keys,
        or delete data.
      </p>

      {canManage && <InviteForm />}

      <div className="mt-6">
        {!members || members.length === 0 ? (
          <EmptyState
            title="Just you"
            description="Invite teammates above to grant dashboard access."
          />
        ) : (
          <ul className="divide-y divide-border border border-border rounded-[4px]">
            {members.map((m) => (
              <MemberRow
                key={m.user_id}
                userId={m.user_id}
                role={m.role}
                invitedAt={m.invited_at}
                acceptedAt={m.accepted_at}
                canManage={canManage}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-3">
          Role reference
        </p>
        <div className="border border-border rounded-[4px] divide-y divide-border">
          {[
            ["Owner", "All permissions, including deleting the company."],
            ["Admin", "Invite/remove team, manage integrations, manage finance."],
            ["Manager", "Edit CRM, finance, content. Cannot manage team or keys."],
            ["Member", "Read everything. Cannot edit."],
            ["Viewer", "Read-only dashboards only."],
          ].map(([name, desc]) => (
            <div key={name} className="px-5 py-3 flex items-baseline gap-6">
              <span className="font-body text-sm text-foreground w-24">{name}</span>
              <span className="font-body text-xs text-muted flex-1">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
