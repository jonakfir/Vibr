import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasProAccess } from "@/lib/auth";

export async function POST(request: NextRequest) {
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

    if (!hasProAccess(profile?.email, profile?.subscription_status)) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const { vercelToken, projectName } = await request.json();

    if (!vercelToken || !projectName) {
      return NextResponse.json({ error: "Missing vercelToken or projectName" }, { status: 400 });
    }

    // Create a new Vercel project
    const createRes = await fetch("https://api.vercel.com/v10/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        framework: "nextjs",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: `Vercel API error: ${err}` }, { status: 500 });
    }

    const project = await createRes.json();
    const deployUrl = `https://${project.name}.vercel.app`;

    return NextResponse.json({ url: deployUrl, projectId: project.id });
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
