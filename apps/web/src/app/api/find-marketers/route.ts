import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

interface LinkedInProfile {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  profilePicture?: string;
  linkedInUrl?: string;
  publicIdentifier?: string;
}

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

    const { idea, sector, product_name } = await request.json();

    if (!idea || !sector || !product_name) {
      return NextResponse.json(
        { error: "Missing required fields: idea, sector, product_name" },
        { status: 400 }
      );
    }

    // Run Apify LinkedIn scraper actor
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      return NextResponse.json(
        { error: "Apify API token not configured" },
        { status: 500 }
      );
    }

    const searchTerms = `${sector} marketer OR growth hacker OR growth marketing`;

    // Start the Apify actor run
    const actorRunResponse = await fetch(
      "https://api.apify.com/v2/acts/apify~linkedin-profile-scraper/runs?waitForFinish=120",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apifyToken}`,
        },
        body: JSON.stringify({
          searchTerms,
          maxResults: 20,
          minDelay: 1,
          maxDelay: 5,
        }),
      }
    );

    if (!actorRunResponse.ok) {
      const errorText = await actorRunResponse.text();
      console.error("Apify actor run failed:", errorText);
      return NextResponse.json(
        { error: "Failed to search for marketers" },
        { status: 500 }
      );
    }

    const runData = await actorRunResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      return NextResponse.json(
        { error: "No dataset returned from scraper" },
        { status: 500 }
      );
    }

    // Fetch the dataset items
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`,
      {
        headers: {
          Authorization: `Bearer ${apifyToken}`,
        },
      }
    );

    if (!datasetResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch scraper results" },
        { status: 500 }
      );
    }

    const profiles: LinkedInProfile[] = await datasetResponse.json();

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ marketers: [] });
    }

    // Use Claude to rank and score the profiles
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const profilesSummary = profiles.slice(0, 20).map((p) => ({
      name: p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      headline: p.headline || "",
      linkedin_url:
        p.linkedInUrl ||
        `https://linkedin.com/in/${p.publicIdentifier || ""}`,
      photo: p.profilePicture || "",
    }));

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are helping find the best marketers/growth hackers for a startup.

Product: ${product_name}
Idea: ${typeof idea === "string" ? idea : JSON.stringify(idea)}
Sector: ${sector}

Here are LinkedIn profiles found. Rank them by relevance to this product and sector. For each, provide a match percentage and guess their professional email.

Profiles:
${JSON.stringify(profilesSummary, null, 2)}

Return a JSON array of objects with these fields:
- name: string
- headline: string
- photo: string (the URL from input)
- linkedin_url: string
- match_percent: number (0-100)
- email_guess: string (best guess based on name and likely company domain)

Sort by match_percent descending. Return ONLY valid JSON array.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let marketers;
    try {
      marketers = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        marketers = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to rank marketers" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ marketers });
  } catch (error) {
    console.error("Find marketers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
