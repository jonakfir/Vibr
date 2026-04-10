import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[auth/callback]", {
    hasCode: !!code,
    error: error_param,
    error_description,
    origin,
    url: request.url,
  });

  if (error_param) {
    console.error("[auth/callback] OAuth provider returned error:", error_param, error_description);
    return NextResponse.redirect(
      `${origin}/?error=oauth&reason=${encodeURIComponent(error_description || error_param)}`
    );
  }

  if (!code) {
    console.error("[auth/callback] No code in callback URL");
    return NextResponse.redirect(`${origin}/?error=auth&reason=no_code`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      return NextResponse.redirect(
        `${origin}/?error=auth&reason=${encodeURIComponent(error.message)}`
      );
    }

    console.log("[auth/callback] session created for user:", data.user?.email);

    // Check if user has completed onboarding
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = (await supabase
        .from("profiles")
        .select("full_name, skills")
        .eq("id", user.id)
        .single()) as {
        data: { full_name: string | null; skills: string[] | null } | null;
      };

      // Redirect to onboarding if profile is incomplete
      if (!profile?.full_name || !profile?.skills?.length) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (e: any) {
    console.error("[auth/callback] unexpected exception:", e?.message, e?.stack);
    return NextResponse.redirect(
      `${origin}/?error=auth&reason=${encodeURIComponent(e?.message || "unknown")}`
    );
  }
}
