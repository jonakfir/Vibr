import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyRole } from "./types";

const ACTIVE_COMPANY_COOKIE = "vibr_active_company";

/**
 * Resolve the active company for the current request.
 *   1. Cookie override → verify membership before trusting.
 *   2. Otherwise → first company the user is a member of.
 * Returns null when the user has no companies yet.
 */
export async function getActiveCompany(): Promise<{
  company: Company;
  role: CompanyRole;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const jar = await cookies();
  const preferredId = jar.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;

  const { data: memberships, error } = await supabase
    .from("company_members")
    .select("role, company:companies(*)")
    .eq("user_id", user.id);

  if (error || !memberships || memberships.length === 0) return null;

  const rows = memberships
    .map((m: any) => ({ role: m.role as CompanyRole, company: m.company as Company }))
    .filter((m) => !!m.company);

  if (rows.length === 0) return null;

  const pick =
    (preferredId && rows.find((r) => r.company.id === preferredId)) || rows[0];

  return pick;
}

export async function listUserCompanies(): Promise<
  { company: Company; role: CompanyRole }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("company_members")
    .select("role, company:companies(*)")
    .eq("user_id", user.id)
    .order("invited_at", { ascending: true });

  if (error || !data) return [];
  return data
    .map((m: any) => ({ role: m.role as CompanyRole, company: m.company as Company }))
    .filter((m) => !!m.company);
}

/**
 * Use inside server components that require a company; redirects to
 * the new-company flow when the user has none yet.
 */
export async function requireActiveCompany(): Promise<{
  company: Company;
  role: CompanyRole;
}> {
  const active = await getActiveCompany();
  if (!active) redirect("/dashboard/new");
  return active;
}

export const ACTIVE_COMPANY_COOKIE_NAME = ACTIVE_COMPANY_COOKIE;
