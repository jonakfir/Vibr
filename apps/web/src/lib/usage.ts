import { isAdmin, hasProAccess } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const FREE_LIMITS: Record<string, number> = {
  idea_generation: 3,
  domain_check: 5,
  marketer_scan: 1,
};

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function trackUsage(userId: string, actionType: string) {
  const supabase = getServiceClient();
  await supabase.from("usage").insert({ user_id: userId, action_type: actionType });
}

export async function getUsageCounts(userId: string): Promise<Record<string, number>> {
  const supabase = getServiceClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("usage")
    .select("action_type")
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.action_type] = (counts[row.action_type] || 0) + 1;
  }
  return counts;
}

export async function checkLimit(
  userId: string,
  email: string | null | undefined,
  subscriptionStatus: string | null | undefined,
  actionType: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (hasProAccess(email, subscriptionStatus)) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const limit = FREE_LIMITS[actionType] ?? 0;
  const counts = await getUsageCounts(userId);
  const used = counts[actionType] || 0;

  return { allowed: used < limit, used, limit };
}
