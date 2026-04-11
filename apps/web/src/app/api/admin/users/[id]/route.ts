import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";

/**
 * DELETE /api/admin/users/:id — permanently remove a user from auth.users.
 * The `profiles` row is removed automatically via ON DELETE CASCADE.
 *
 * Guardrails: caller must be a hardcoded admin, AND we refuse to delete
 * a hardcoded admin account (so the owner can't accidentally lock
 * themselves out via the admin UI).
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminCaller();
  if ("error" in gate) return gate.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up the target's email so we can refuse to delete hardcoded admins.
  const { data: target, error: getErr } = await admin.auth.admin.getUserById(id);
  if (getErr || !target?.user) {
    return NextResponse.json(
      { error: getErr?.message ?? "user not found" },
      { status: 404 }
    );
  }

  if (isAdmin(target.user.email)) {
    return NextResponse.json(
      { error: "cannot delete a hardcoded admin account" },
      { status: 400 }
    );
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
