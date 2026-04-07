import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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

    // Usage check
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, subscription_status")
      .eq("id", user.id)
      .single();

    const { checkLimit, trackUsage } = await import("@/lib/usage");
    const limitCheck = await checkLimit(user.id, profile?.email, profile?.subscription_status, "idea_generation");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "limit_reached", used: limitCheck.used, limit: limitCheck.limit, action: "idea_generation" },
        { status: 403 }
      );
    }

    const { skills, interests, experience_level } = await request.json();

    if (!skills || !interests || !experience_level) {
      return NextResponse.json(
        { error: "Missing required fields: skills, interests, experience_level" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Based on this entrepreneur profile, generate 5 unique and viable business ideas.

Profile:
- Skills: ${Array.isArray(skills) ? skills.join(", ") : skills}
- Interests: ${Array.isArray(interests) ? interests.join(", ") : interests}
- Experience Level: ${experience_level}

For each idea, provide:
- id: a unique slug identifier (lowercase, hyphens)
- name: a catchy business name
- sector: the industry sector
- description: 2-3 sentence description of the business
- market_size: estimated market size (e.g., "$5B", "$500M")
- difficulty: "easy" | "medium" | "hard"
- monetization_model: how it makes money (e.g., "SaaS subscription", "marketplace commission")
- tagline: a memorable one-liner

Return ONLY a valid JSON array of 5 objects. No other text.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let ideas;
    try {
      ideas = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to generate ideas" },
          { status: 500 }
        );
      }
    }

    await trackUsage(user.id, "idea_generation");

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Generate ideas error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
