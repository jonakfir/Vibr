export type CompanyRole = "owner" | "admin" | "manager" | "member" | "viewer";

export interface Company {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  stripe_account_id: string | null;
  created_at: string;
}

export interface CompanyMember {
  company_id: string;
  user_id: string;
  role: CompanyRole;
  invited_at: string;
  accepted_at: string | null;
  email?: string | null;
}

export type IntegrationProvider =
  | "stripe"
  | "resend"
  | "google"
  | "supabase"
  | "custom";

export interface CompanyIntegration {
  id: string;
  company_id: string;
  provider: IntegrationProvider;
  status: "connected" | "error" | "disconnected";
  last_sync_at: string | null;
  metadata: Record<string, unknown>;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  stage: "lead" | "qualified" | "proposal" | "won" | "lost";
  source: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  company_id: string;
  contact_id: string | null;
  title: string;
  amount_cents: number;
  currency: string;
  stage: "new" | "contact" | "demo" | "proposal" | "won" | "lost";
  close_date: string | null;
}

export interface Expense {
  id: string;
  company_id: string;
  amount_cents: number;
  currency: string;
  category: string | null;
  vendor: string | null;
  occurred_on: string;
  receipt_url: string | null;
}

export interface RevenueEvent {
  id: string;
  company_id: string;
  source: string;
  amount_cents: number;
  currency: string;
  kind: "payment" | "refund" | "payout";
  occurred_at: string;
}

export interface ContentItem {
  id: string;
  company_id: string;
  platform: string;
  status: "draft" | "scheduled" | "published" | "failed";
  title: string | null;
  body: string;
  scheduled_for: string | null;
  published_at: string | null;
}

export const ROLE_RANK: Record<CompanyRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};

export function canWrite(role: CompanyRole | null | undefined): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK.manager;
}

export function canManageTeam(role: CompanyRole | null | undefined): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}
