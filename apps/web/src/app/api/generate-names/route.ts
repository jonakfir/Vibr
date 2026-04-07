import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

async function checkDomainAvailability(
  name: string
): Promise<{ domain: string; available: boolean }> {
  const domain = `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

  try {
    const response = await fetch(
      `https://domains-api.p.rapidapi.com/domain/${encodeURIComponent(domain)}`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": "domains-api.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { domain, available: false };
    }

    const data = await response.json();
    const available = data.available === true || data.status === "available";

    return { domain, available };
  } catch {
    return { domain, available: false };
  }
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

    const { idea } = await request.json();

    if (!idea) {
      return NextResponse.json(
        { error: "Missing required field: idea" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Generate 5 creative, memorable, and brandable product names for this business idea:

${typeof idea === "string" ? idea : JSON.stringify(idea)}

Requirements:
- Short (1-2 words preferred)
- Easy to spell and pronounce
- Would work well as a .com domain
- Modern and tech-friendly

Return ONLY a valid JSON array of 5 strings (just the names). No other text.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let namesList: string[];
    try {
      namesList = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        namesList = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to generate names" },
          { status: 500 }
        );
      }
    }

    // Check domain availability for each name
    const names = await Promise.all(
      namesList.map(async (name: string) => {
        const { domain, available } = await checkDomainAvailability(name);
        return { name, domain, available };
      })
    );

    return NextResponse.json({ names });
  } catch (error) {
    console.error("Generate names error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
