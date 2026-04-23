import { NextResponse } from "next/server";
import { requireCompany, logAudit } from "@/lib/dashboard/api-helpers";

const PLATFORMS = new Set(["x", "linkedin", "email", "reddit", "instagram", "tiktok"]);
const STATUSES = new Set(["draft", "scheduled", "published", "failed"]);

export async function POST(request: Request) {
  const ctx = await requireCompany({ require: "write" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const platform = typeof body.platform === "string" ? body.platform : "";
  const status = typeof body.status === "string" ? body.status : "draft";
  const postBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!PLATFORMS.has(platform) || !STATUSES.has(status) || !postBody) {
    return NextResponse.json(
      { error: "platform, status, and body required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("company_content")
    .insert({
      company_id: company.id,
      platform,
      status,
      title: typeof body.title === "string" && body.title ? body.title : null,
      body: postBody,
      scheduled_for:
        typeof body.scheduled_for === "string" && body.scheduled_for
          ? new Date(body.scheduled_for).toISOString()
          : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "content.create", {
    platform,
    status,
  });
  return NextResponse.json({ item: data });
}
