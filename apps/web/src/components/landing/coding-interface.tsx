"use client";

import { SectionReveal } from "@/components/ui/section-reveal";

const terminalLines = [
  { text: "$ vibr-local start --model claude-3.5-sonnet", type: "command" },
  { text: "", type: "blank" },
  { text: "  Connecting to local project...", type: "muted" },
  { text: "  Model: claude-3.5-sonnet (BYOK)", type: "muted" },
  { text: "  Workspace: ~/projects/thumbnail-ai", type: "muted" },
  { text: "", type: "blank" },
  { text: "▸ Scaffolding Next.js app with TypeScript...", type: "highlight" },
  { text: "  ✓ Created /src/app/layout.tsx", type: "muted" },
  { text: "  ✓ Created /src/app/page.tsx", type: "muted" },
  { text: "  ✓ Created /src/components/upload.tsx", type: "muted" },
  { text: "", type: "blank" },
  {
    text: "▸ Adding image processing pipeline...",
    type: "highlight",
  },
  { text: "  ✓ Created /src/lib/thumbnail-gen.ts", type: "muted" },
  { text: "  ✓ Installed sharp, @vercel/og", type: "muted" },
  { text: "", type: "blank" },
  { text: "▸ Writing API route for generation...", type: "highlight" },
  { text: "  ✓ Created /src/app/api/generate/route.ts", type: "muted" },
  { text: "", type: "blank" },
  { text: "  Ready. Open http://localhost:3000", type: "highlight" },
];

export function CodingInterface() {
  return (
    <section className="relative py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <SectionReveal>
          <h2 className="font-heading font-light text-title text-foreground">
            Your files. Your model.
            <br />
            Your build.
          </h2>
          <div className="mt-8 space-y-4">
            <p className="font-body font-light text-body text-muted leading-relaxed">
              vibr-local connects directly to your project files. Point it at
              any directory and it understands your codebase — the structure,
              the dependencies, the patterns you already use.
            </p>
            <p className="font-body font-light text-body text-muted leading-relaxed">
              Bring your own API key for any supported model — Claude, GPT-4,
              Gemini, or local models via Ollama. Responses stream in real-time
              as your project takes shape, file by file.
            </p>
            <p className="font-body font-light text-body text-muted leading-relaxed">
              No lock-in. No hosted environment. Everything runs on your
              machine, committed to your repo.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div className="bg-card border border-card-border rounded-[4px] overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-card-border">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A1A1A]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#3A2E1A]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A2E1A]" />
              <span className="ml-3 font-mono text-xs text-muted">
                vibr-local
              </span>
            </div>

            {/* Terminal content */}
            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto max-h-[420px]">
              {terminalLines.map((line, i) => {
                if (line.type === "blank") {
                  return <div key={i} className="h-3" />;
                }
                return (
                  <div
                    key={i}
                    className={
                      line.type === "highlight"
                        ? "text-foreground"
                        : line.type === "command"
                          ? "text-foreground"
                          : "text-muted"
                    }
                  >
                    {line.text}
                  </div>
                );
              })}
              <div className="mt-1 text-foreground animate-pulse">▊</div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
