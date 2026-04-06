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
      `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(domain)}`,
      {
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "domainr.p.rapidapi.com",
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
    const status = data.status?.[0]?.status || "";
    const available =
      status.includes("undelegated") ||
      status.includes("inactive") ||
      status.includes("available");

    return NextResponse.json({ domain, available });
  } catch (error) {
    console.error("Check domain error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
