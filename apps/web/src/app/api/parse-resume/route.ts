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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PDF, DOC, DOCX, TXT" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload resume" },
        { status: 500 }
      );
    }

    // For PDF/DOC files, we pass the raw bytes to Claude via base64
    // Claude can read PDFs and text files directly
    const base64Content = Buffer.from(fileBuffer).toString("base64");

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf" as const,
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `Analyze this resume and extract the following information in JSON format:
{
  "full_name": "The person's full name",
  "skills": ["Array of technical and soft skills"],
  "experience_level": "junior | mid | senior | executive",
  "interests": ["Array of professional interests and domains they seem passionate about"]
}

Return ONLY valid JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse resume data" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ...parsed,
      resume_url: fileName,
    });
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
