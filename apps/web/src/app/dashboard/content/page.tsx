import { requireActiveCompany } from "@/lib/dashboard/company";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ContentComposer } from "./_components/content-composer";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { company, role } = await requireActiveCompany();
  const supabase = await createClient();
  const params = await searchParams;
  const activeStatus = params.status ?? "draft";

  const { data: items } = await supabase
    .from("company_content")
    .select("*")
    .eq("company_id", company.id)
    .eq("status", activeStatus)
    .order("created_at", { ascending: false });

  const canWrite = role === "owner" || role === "admin" || role === "manager";

  return (
    <div className="p-10 max-w-[1100px]">
      <h1 className="font-heading font-light text-3xl text-foreground mb-3">
        Content
      </h1>
      <p className="font-body text-sm text-muted mb-8">
        Drafts, scheduled posts, and the live feed for {company.name}.
      </p>

      <div className="flex items-center gap-6 border-b border-border mb-8">
        {TABS.map((t) => {
          const active = activeStatus === t.key;
          return (
            <a
              key={t.key}
              href={`/dashboard/content?status=${t.key}`}
              className={`font-body text-sm pb-3 border-b-2 transition-colors ${
                active
                  ? "text-foreground border-foreground"
                  : "text-muted border-transparent hover:text-foreground"
              }`}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      {canWrite && activeStatus === "draft" && <ContentComposer />}

      {!items || items.length === 0 ? (
        <EmptyState
          title={`No ${activeStatus} content`}
          description={
            activeStatus === "draft"
              ? "Compose a post above or pull a draft from the MCC pipeline."
              : activeStatus === "scheduled"
                ? "Scheduled posts will appear here until their publish time."
                : "Published posts land here with their engagement stats."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-border rounded-[4px] p-5 bg-card/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-[10px] uppercase tracking-wide text-muted">
                  {item.platform}
                </span>
                <span className="font-body text-[10px] text-muted">
                  {item.scheduled_for
                    ? new Date(item.scheduled_for).toLocaleString()
                    : item.published_at
                      ? new Date(item.published_at).toLocaleString()
                      : new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              {item.title && (
                <p className="font-heading font-light text-base text-foreground mb-2">
                  {item.title}
                </p>
              )}
              <p className="font-body text-sm text-muted leading-relaxed whitespace-pre-wrap line-clamp-6">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
