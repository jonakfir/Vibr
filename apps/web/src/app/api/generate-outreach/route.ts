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

    const { marketer, product_name, idea } = await request.json();

    if (!marketer || !product_name || !idea) {
      return NextResponse.json(
        { error: "Missing required fields: marketer, product_name, idea" },
        { status: 400 }
      );
    }

    const firstlineApiUrl = process.env.FIRSTLINE_API_URL;
    if (!firstlineApiUrl) {
      return NextResponse.json(
        { error: "Firstline API URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${firstlineApiUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketer_name: marketer.name,
        marketer_headline: marketer.headline,
        product_name,
        product_description:
          typeof idea === "string" ? idea : idea.description || JSON.stringify(idea),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firstline API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate outreach email" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      subject: data.subject,
      body: data.body,
    });
  } catch (error) {
    console.error("Generate outreach error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
