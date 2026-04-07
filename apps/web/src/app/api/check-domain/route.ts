import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, subscription_status")
      .eq("id", user.id)
      .single();

    const { checkLimit, trackUsage } = await import("@/lib/usage");
    const limitCheck = await checkLimit(user.id, profileData?.email, profileData?.subscription_status, "domain_check");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "limit_reached", used: limitCheck.used, limit: limitCheck.limit, action: "domain_check" },
        { status: 403 }
      );
    }

    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "Missing required field: domain" },
        { status: 400 }
      );
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      return NextResponse.json(
        { error: "Domain check API not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://domains-api.p.rapidapi.com/domain/${encodeURIComponent(domain)}`,
      {
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "domains-api.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to check domain availability" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const available = data.available === true || data.status === "available";

    await trackUsage(user.id, "domain_check");

    return NextResponse.json({ domain, available });
  } catch (error) {
    console.error("Check domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
