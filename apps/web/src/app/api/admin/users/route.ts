import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";

/**
 * Admin user-management endpoints.
 *
 * GET  /api/admin/users           — list every auth user + their profile row
 * POST /api/admin/users           — create a new user (email + password)
 *                                   optionally { make_admin: true } is ignored
 *                                   because admin status is controlled by the
 *                                   hardcoded list in lib/auth.ts, not by the
 *                                   user row itself.
 *
 * All handlers require the caller to be signed in AND in the hardcoded
 * admin list. They use the service-role key to bypass RLS and talk to the
 * auth.users table.
 */

async function requireAdminCaller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!isAdmin(user.email)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const gate = await requireAdminCaller();
  if ("error" in gate) return gate.error;

  const admin = createAdminClient();

  // List auth users. The admin SDK paginates — 1000 is enough for now.
  const { data: authData, error: authErr } =
    await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    return NextResponse.json({ error: authErr.message }, { status: 500 });
  }

  // Join with profile rows for display info.
  const ids = authData.users.map((u) => u.id);
  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, subscription_status, experience_level, skills, created_at"
    )
    .in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const profileById = new Map<string, any>();
  for (const p of profiles ?? []) profileById.set(p.id, p);

  const users = authData.users.map((u) => {
    const p = profileById.get(u.id) ?? {};
    return {
      id: u.id,
      email: u.email ?? p.email ?? null,
      full_name: p.full_name ?? (u.user_metadata?.full_name as string) ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      subscription_status: p.subscription_status ?? "free",
      experience_level: p.experience_level ?? null,
      skills: p.skills ?? [],
      is_admin: isAdmin(u.email ?? null),
    };
  });

  // Newest first.
  users.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const gate = await requireAdminCaller();
  if ("error" in gate) return gate.error;

  let body: { email?: string; password?: string; full_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.full_name ?? "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Auto-confirm so the admin-created account can sign in immediately.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const newUser = data.user;
  if (newUser) {
    // The signup trigger should create a profile row, but upsert to be safe.
    await admin.from("profiles").upsert(
      {
        id: newUser.id,
        email: newUser.email,
        full_name: fullName || null,
      },
      { onConflict: "id" }
    );
  }

  return NextResponse.json({ user: newUser });
}
