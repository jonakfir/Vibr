import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Bootstrap the hardcoded owner account.
 *
 * POST /api/admin/bootstrap — ensures `jonakfir@gmail.com` exists in
 * auth.users with the hardcoded password, is marked email-confirmed, and
 * has a corresponding profiles row. Safe to call repeatedly; subsequent
 * calls just make sure the password is reset to the canonical value.
 *
 * This intentionally does NOT require the caller to be signed in — it's
 * how the owner gets into a fresh install in the first place. It can be
 * called from the sign-in page ("reset owner password"), from a curl
 * during setup, or from the admin UI.
 */

const OWNER_EMAIL = "jonakfir@gmail.com";
const OWNER_PASSWORD = "Jonathankfir7861!";
const OWNER_FULL_NAME = "Jonathan Kfir";

export async function POST() {
  return run();
}

// Allow GET as well so you can hit the URL in a browser during setup.
export async function GET() {
  return run();
}

async function run() {
  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Supabase admin client could not be created",
      },
      { status: 500 }
    );
  }

  // See if the user already exists. listUsers filters by email.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  const existing = list.users.find(
    (u) => (u.email ?? "").toLowerCase() === OWNER_EMAIL
  );

  let userId: string;
  let created = false;

  if (existing) {
    // Reset the password + make sure the email is confirmed.
    const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          full_name:
            (existing.user_metadata?.full_name as string | undefined) ||
            OWNER_FULL_NAME,
        },
      }
    );
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    userId = updated.user?.id ?? existing.id;
  } else {
    const { data: createdUser, error: createErr } =
      await admin.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: OWNER_FULL_NAME },
      });
    if (createErr || !createdUser.user) {
      return NextResponse.json(
        { error: createErr?.message ?? "failed to create owner user" },
        { status: 500 }
      );
    }
    userId = createdUser.user.id;
    created = true;
  }

  // Ensure a profiles row exists with the owner's name.
  await admin.from("profiles").upsert(
    {
      id: userId,
      email: OWNER_EMAIL,
      full_name: OWNER_FULL_NAME,
    },
    { onConflict: "id" }
  );

  return NextResponse.json({
    ok: true,
    created,
    email: OWNER_EMAIL,
    user_id: userId,
  });
}
