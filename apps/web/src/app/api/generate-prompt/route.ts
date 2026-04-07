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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("email, subscription_status")
      .eq("id", user.id)
      .single();

    const { hasProAccess } = await import("@/lib/auth");
    if (!hasProAccess(profileData?.email, profileData?.subscription_status)) {
      return NextResponse.json({ error: "pro_required" }, { status: 403 });
    }

    const { idea, product_name } = await request.json();

    if (!idea || !product_name) {
      return NextResponse.json(
        { error: "Missing required fields: idea, product_name" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const ideaDescription =
      typeof idea === "string" ? idea : JSON.stringify(idea);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: `You are an expert software architect and product designer. Generate a comprehensive vibe-coding prompt that can be used with Claude Code or a similar AI coding assistant to build the following product from scratch.

Product Name: ${product_name}
Business Idea: ${ideaDescription}

The prompt should be a complete system prompt / project brief that includes:

1. **Project Overview**: What the product does, who it's for, core value proposition
2. **Tech Stack Recommendations**: Frontend framework, backend, database, hosting, key libraries
3. **File Structure**: Suggested directory layout for the project
4. **Core Features**: Detailed list of MVP features with acceptance criteria
5. **Data Models**: Key database tables/schemas
6. **API Endpoints**: RESTful API design with routes, methods, request/response shapes
7. **UI/UX Design Guidance**: Color scheme suggestions, layout principles, component hierarchy
8. **Authentication & Authorization**: Auth flow recommendations
9. **Third-party Integrations**: Any APIs or services to integrate
10. **Deployment**: How to deploy, environment variables needed
11. **Development Phases**: Suggested order of implementation

Make the prompt detailed enough that an AI coding assistant could build a working MVP. Use modern best practices (Next.js App Router, TypeScript, Tailwind CSS, etc. as appropriate).

Return the prompt as a single string — this will be directly used as a coding prompt. Do not wrap it in JSON.`,
        },
      ],
    });

    const prompt =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Generate prompt error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
