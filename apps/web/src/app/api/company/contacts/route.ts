import { NextResponse } from "next/server";
import { requireCompany, logAudit } from "@/lib/dashboard/api-helpers";

const STAGES = ["lead", "qualified", "proposal", "won", "lost"] as const;

export async function POST(request: Request) {
  const ctx = await requireCompany({ require: "write" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;
  const stage = STAGES.includes(body.stage) ? body.stage : "lead";
  const source = typeof body.source === "string" ? body.source : "manual";

  if (!name) {
    return NextResponse.json({ error: "Name required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("company_contacts")
    .insert({ company_id: company.id, name, email, stage, source })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "contact.create", {
    name,
    stage,
  });
  return NextResponse.json({ contact: data });
}
