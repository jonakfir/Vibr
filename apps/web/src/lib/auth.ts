import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export function hasProAccess(
  email: string | undefined | null,
  subscriptionStatus: string | null | undefined
): boolean {
  if (isAdmin(email)) return true;
  return subscriptionStatus === "active";
}
