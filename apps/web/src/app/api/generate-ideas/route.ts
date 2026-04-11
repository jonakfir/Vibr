import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/generate-ideas
 *
 * Body: { skills: string[], interests: string[], experience_level: string }
 *
 * Returns: { ideas: Idea[] } where each Idea matches the shape consumed by
 * the onboarding/ideas page (id, name, description, sector, metadata).
 *
 * Auth: requires a signed-in user. We don't currently rate-limit beyond
 * that — usage tracking lives in lib/usage.ts and can be wired up later.
 *
 * If ANTHROPIC_API_KEY is missing or the model returns garbage, we fall
 * back to a small set of generic ideas so the page is never blank.
 */

interface Idea {
  id: string;
  name: string;
  description: string;
  sector: string;
  metadata: {
    market: string;
    timeline: string;
    competition: string;
  };
}

const FALLBACK_IDEAS: Idea[] = [
  {
    id: "fallback-1",
    name: "ReviewLoop",
    description:
      "AI code-review bot that reads pull requests, flags bugs, and suggests refactors based on the team's existing style guide.",
    sector: "Developer Tools",
    metadata: { market: "$4.2B", timeline: "3 weeks to MVP", competition: "Medium" },
  },
  {
    id: "fallback-2",
    name: "ThumbCraft",
    description:
      "Generate scroll-stopping YouTube thumbnails using AI trained on top-performing content in your niche.",
    sector: "Creator Tools",
    metadata: { market: "$1.8B", timeline: "2 weeks to MVP", competition: "Growing" },
  },
  {
    id: "fallback-3",
    name: "MeetingMind",
    description:
      "AI note-taker that joins meetings, extracts action items, and syncs them straight into your project tracker.",
    sector: "Productivity",
    metadata: { market: "$6.1B", timeline: "4 weeks to MVP", competition: "High" },
  },
  {
    id: "fallback-4",
    name: "InboxZeroAI",
    description:
      "Auto-sorts and pre-drafts replies for the messy long-tail of your inbox so you only touch the messages that need a human.",
    sector: "Productivity",
    metadata: { market: "$2.9B", timeline: "3 weeks to MVP", competition: "Medium" },
  },
  {
    id: "fallback-5",
    name: "SnippetVault",
    description:
      "A personal AI knowledge base for engineers — drop in code snippets and design notes, query them in natural language.",
    sector: "Developer Tools",
    metadata: { market: "$1.4B", timeline: "2 weeks to MVP", competition: "Low" },
  },
];

function shortId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeIdea(raw: unknown, idx: number): Idea | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const name =
    (typeof obj.name === "string" && obj.name) ||
    (typeof obj.title === "string" && obj.title) ||
    "";
  const description =
    (typeof obj.description === "string" && obj.description) ||
    (typeof obj.desc === "string" && obj.desc) ||
    "";
  if (!name || !description) return null;

  const sector =
    (typeof obj.sector === "string" && obj.sector) ||
    (typeof obj.category === "string" && obj.category) ||
    "SaaS";

  const metaSource =
    (obj.metadata && typeof obj.metadata === "object"
      ? (obj.metadata as Record<string, unknown>)
      : null) ?? (obj as Record<string, unknown>);

  const market =
    (typeof metaSource.market === "string" && metaSource.market) ||
    (typeof metaSource.market_size === "string" && metaSource.market_size) ||
    "—";
  const timeline =
    (typeof metaSource.timeline === "string" && metaSource.timeline) ||
    (typeof metaSource.time_to_mvp === "string" && metaSource.time_to_mvp) ||
    "—";
  const competition =
    (typeof metaSource.competition === "string" && metaSource.competition) ||
    "—";

  return {
    id: typeof obj.id === "string" ? obj.id : `idea-${idx}-${shortId()}`,
    name,
    description,
    sector,
    metadata: { market, timeline, competition },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Auth — we want a real user but we don't *fail* the request if Supabase
    // is misconfigured locally. Just skip the check in that case.
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      // Supabase not configured — allow the request through so the page
      // still works in dev environments.
    }

    const body = await request.json().catch(() => ({}));
    const skills: string[] = Array.isArray(body.skills) ? body.skills : [];
    const interests: string[] = Array.isArray(body.interests)
      ? body.interests
      : [];
    const experienceLevel: string =
      typeof body.experience_level === "string" ? body.experience_level : "";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No key — return fallback ideas so the UI is never empty.
      return NextResponse.json({ ideas: FALLBACK_IDEAS, fallback: true });
    }

    const anthropic = new Anthropic({ apiKey });

    const skillStr = skills.length ? skills.join(", ") : "general software";
    const interestStr = interests.length
      ? interests.join(", ")
      : "consumer SaaS";
    const expStr = experienceLevel || "intermediate";

    const prompt = `Generate 5 SaaS business ideas for a developer with this profile:

Skills: ${skillStr}
Interests: ${interestStr}
Experience level: ${expStr}

Each idea must be:
- Realistically buildable by a single developer with these skills
- Tied to real, sizable market demand
- Differentiated from existing players

Return ONLY valid JSON in this exact shape, no markdown, no explanation:

{
  "ideas": [
    {
      "name": "Short product name",
      "sector": "Category like 'Developer Tools' or 'Healthcare'",
      "description": "1-2 sentence pitch describing what it does and who it's for.",
      "metadata": {
        "market": "Estimated market size like '$2.4B'",
        "timeline": "Time to MVP like '3 weeks to MVP'",
        "competition": "One word: Low, Medium, High, or Growing"
      }
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    const rawIdeas =
      parsed && typeof parsed === "object" && "ideas" in parsed
        ? (parsed as { ideas: unknown[] }).ideas
        : [];

    const ideas = Array.isArray(rawIdeas)
      ? rawIdeas
          .map((r, i) => normalizeIdea(r, i))
          .filter((x): x is Idea => x !== null)
      : [];

    if (ideas.length === 0) {
      return NextResponse.json({ ideas: FALLBACK_IDEAS, fallback: true });
    }

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("generate-ideas error:", error);
    // Return fallback ideas instead of an error so the page is never empty.
    return NextResponse.json({
      ideas: FALLBACK_IDEAS,
      fallback: true,
      error: error instanceof Error ? error.message : "internal error",
    });
  }
}
