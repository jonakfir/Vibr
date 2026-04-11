import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/generate-prompt
 *
 * Body: { idea: Idea, product_name: string }
 * Returns: { prompt: string }
 *
 * Generates a Claude-Code-ready starter prompt for the user's chosen
 * idea. The prompt describes what to build, the suggested tech stack,
 * the first few features to ship, and ends with a single concrete first
 * task so the assistant can start producing code right away.
 *
 * If ANTHROPIC_API_KEY isn't set we fall back to a deterministic
 * template so the build page is never empty.
 */

interface IdeaInput {
  name?: string;
  description?: string;
  desc?: string;
  sector?: string;
  category?: string;
  metadata?: {
    market?: string;
    timeline?: string;
    competition?: string;
  };
  is_custom?: boolean;
}

function fallbackPrompt(idea: IdeaInput, productName: string): string {
  const name = productName || idea.name || "My SaaS";
  const sector = idea.sector || idea.category || "SaaS";
  const description =
    idea.description || idea.desc || "A modern web app.";

  return `# ${name}

You are helping me build **${name}**, a ${sector} product.

## What it does
${description}

## Tech stack
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS for styling
- Supabase for auth and database
- Vercel for deployment

## First milestone
Scaffold the project, set up the landing page, and wire up email/password auth.

## First task
Create a Next.js project structure with:
1. A landing page hero that explains what ${name} does
2. Tailwind configured with a clean dark theme
3. Supabase client set up in /lib/supabase
4. /auth route with sign-in and sign-up forms

Once the scaffolding is in place, ask me what feature to build next.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const idea: IdeaInput = body.idea ?? {};
    const productName: string =
      typeof body.product_name === "string" ? body.product_name : "";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        prompt: fallbackPrompt(idea, productName),
        fallback: true,
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const ideaSummary = JSON.stringify(
      {
        name: productName || idea.name,
        sector: idea.sector || idea.category,
        description: idea.description || idea.desc,
        market: idea.metadata?.market,
        timeline: idea.metadata?.timeline,
        competition: idea.metadata?.competition,
        is_custom: !!idea.is_custom,
      },
      null,
      2
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are writing the FIRST prompt that a developer will send to Claude Code (Anthropic's CLI coding agent) to start building this product. The developer will paste this into a chat with the AI to kick off implementation.

Product info:
${ideaSummary}

Write the prompt as Markdown with these sections:
- Title: # ${productName || idea.name || "Product"}
- "What it does" — a 2-3 sentence pitch
- "Tech stack" — a short list. Default to Next.js + TypeScript + Tailwind + Supabase + Vercel unless the idea clearly needs something else.
- "First milestone" — what you should have working at the end of session 1
- "First task" — a SINGLE concrete, actionable first step (numbered list of substeps if needed) that the assistant can start coding immediately

Keep the whole prompt under ~250 words. Be specific to this exact idea, not generic. End with "Once the scaffolding is in place, ask me what feature to build next." Return ONLY the prompt text, no preamble, no explanation.`,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text.trim() : "";

    if (!text) {
      return NextResponse.json({
        prompt: fallbackPrompt(idea, productName),
        fallback: true,
      });
    }

    return NextResponse.json({ prompt: text });
  } catch (error) {
    console.error("generate-prompt error:", error);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      prompt: fallbackPrompt(body.idea ?? {}, body.product_name ?? ""),
      fallback: true,
      error: error instanceof Error ? error.message : "internal error",
    });
  }
}
