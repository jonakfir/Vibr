import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin emails are sourced from the ADMIN_EMAILS env var, comma-separated.
 * Matching is case-insensitive and ignores surrounding whitespace.
 * `jonakfir@gmail.com` and `jonakfir@berkeley.edu` are hardcoded so the
 * owner can never lose admin access even if the env var gets cleared.
 */
const HARDCODED_ADMIN_EMAILS = [
  "jonakfir@gmail.com",
  "jonakfir@berkeley.edu",
];

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const all = new Set<string>([
    ...HARDCODED_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...fromEnv,
  ]);
  return Array.from(all);
}

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function hasProAccess(
  email?: string | null,
  subscriptionStatus?: string | null
): boolean {
  if (isAdmin(email)) return true;
  return (
    subscriptionStatus === "active" || subscriptionStatus === "trialing"
  );
}

/**
 * Server-side: get the current user or null. Use in server components and
 * route handlers.
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Server-side: redirect to /auth if not signed in. */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }
  return user;
}

/** Server-side: redirect to home if not an admin. */
export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdmin(user.email)) {
    redirect("/");
  }
  return user;
}

// Legacy alias kept so older imports don't break.
export const getUser = getCurrentUser;
