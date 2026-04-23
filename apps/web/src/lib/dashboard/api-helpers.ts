import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompany } from "./company";
import { canWrite, canManageTeam, type CompanyRole } from "./types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
      user: null,
      supabase,
    };
  }
  return { error: null, user, supabase };
}

export async function requireCompany(options: {
  require?: "member" | "write" | "admin";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    } as const;
  }
  const active = await getActiveCompany();
  if (!active) {
    return {
      error: NextResponse.json({ error: "No active company" }, { status: 404 }),
    } as const;
  }
  const role: CompanyRole = active.role;
  if (options.require === "write" && !canWrite(role)) {
    return {
      error: NextResponse.json({ error: "Insufficient role" }, { status: 403 }),
    } as const;
  }
  if (options.require === "admin" && !canManageTeam(role)) {
    return {
      error: NextResponse.json({ error: "Insufficient role" }, { status: 403 }),
    } as const;
  }
  return { error: null, user, supabase, company: active.company, role } as const;
}

export async function logAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  userId: string | null,
  action: string,
  payload: Record<string, unknown> = {}
) {
  await supabase
    .from("company_audit_log")
    .insert({ company_id: companyId, user_id: userId, action, payload });
}
