import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_COMPANY_COOKIE_NAME } from "@/lib/dashboard/company";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { company_id } = await request.json().catch(() => ({}));
  if (typeof company_id !== "string") {
    return NextResponse.json({ error: "company_id required" }, { status: 400 });
  }

  // Verify membership before trusting the cookie.
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("company_id", company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const jar = await cookies();
  jar.set(ACTIVE_COMPANY_COOKIE_NAME, company_id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
