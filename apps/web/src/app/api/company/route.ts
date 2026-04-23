import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompany, ACTIVE_COMPANY_COOKIE_NAME } from "@/lib/dashboard/company";
import { logAudit } from "@/lib/dashboard/api-helpers";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const slug =
    typeof body.slug === "string"
      ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
      : "";

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name and slug are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({ name, slug, owner_user_id: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That slug is already taken." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const jar = await cookies();
  jar.set(ACTIVE_COMPANY_COOKIE_NAME, data.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  await logAudit(supabase, data.id, user.id, "company.create", { name, slug });

  return NextResponse.json({ company: data });
}

export async function PATCH(request: Request) {
  const active = await getActiveCompany();
  if (!active) {
    return NextResponse.json({ error: "No active company" }, { status: 404 });
  }
  if (active.role !== "owner" && active.role !== "admin") {
    return NextResponse.json({ error: "Insufficient role" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.slug === "string") {
    patch.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update(patch)
    .eq("id", active.company.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  await logAudit(supabase, active.company.id, null, "company.update", patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const active = await getActiveCompany();
  if (!active) {
    return NextResponse.json({ error: "No active company" }, { status: 404 });
  }
  if (active.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete a company." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", active.company.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const jar = await cookies();
  jar.delete(ACTIVE_COMPANY_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
