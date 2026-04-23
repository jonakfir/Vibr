import { NextResponse } from "next/server";
import { requireCompany, logAudit } from "@/lib/dashboard/api-helpers";
import type { CompanyRole } from "@/lib/dashboard/types";

const ALLOWED_ROLES: CompanyRole[] = ["admin", "manager", "member", "viewer"];

export async function POST(request: Request) {
  const ctx = await requireCompany({ require: "admin" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role as CompanyRole;

  if (!email || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "email and role (admin|manager|member|viewer) required." },
      { status: 400 }
    );
  }

  // Look up user by email. Requires either a `profiles` view keyed by email
  // or the admin client. For v1 we short-circuit with a placeholder row and
  // rely on a follow-up magic-link invite.
  // @ts-ignore -- admin API is available via service role client in prod
  const lookup = await supabase.rpc("lookup_user_by_email", { p_email: email });
  const existingUserId: string | null = lookup.data ?? null;

  if (!existingUserId) {
    // Store the invite by email in metadata; the accept-invite flow claims it.
    const { error } = await supabase.from("company_audit_log").insert({
      company_id: company.id,
      user_id: user!.id,
      action: "member.invite.pending",
      payload: { email, role },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // TODO: enqueue magic-link email via Resend integration.
    return NextResponse.json({ ok: true, pending: true });
  }

  const { error } = await supabase.from("company_members").insert({
    company_id: company.id,
    user_id: existingUserId,
    role,
    invited_by: user!.id,
    accepted_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That user is already a member." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, company.id, user!.id, "member.invite", { email, role });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const ctx = await requireCompany({ require: "admin" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const body = await request.json().catch(() => ({}));
  const userId = body.user_id as string | undefined;
  const role = body.role as CompanyRole | undefined;

  if (!userId || !role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "user_id and valid role required." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("company_members")
    .update({ role })
    .eq("company_id", company.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "member.role", { userId, role });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ctx = await requireCompany({ require: "admin" });
  if (ctx.error) return ctx.error;
  const { supabase, company, user } = ctx;

  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  // Prevent removing the owner.
  const { data: target } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", company.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (target?.role === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the company owner." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("company_members")
    .delete()
    .eq("company_id", company.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, company.id, user!.id, "member.remove", { userId });
  return NextResponse.json({ ok: true });
}
