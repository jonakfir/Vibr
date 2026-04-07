import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, hasProAccess } from "@/lib/auth";
import { getUsageCounts, FREE_LIMITS } from "@/lib/usage";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, subscription_status")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email;
    const subscriptionStatus = profile?.subscription_status;
    const isPro = hasProAccess(email, subscriptionStatus);
    const admin = isAdmin(email);

    const counts = await getUsageCounts(user.id);

    const usage: Record<string, { used: number; limit: number }> = {};
    for (const [key, limit] of Object.entries(FREE_LIMITS)) {
      usage[key] = { used: counts[key] || 0, limit: isPro ? Infinity : limit };
    }

    return NextResponse.json({
      isPro,
      isAdmin: admin,
      subscriptionStatus: subscriptionStatus || "free",
      usage,
    });
  } catch (error) {
    console.error("Check access error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
