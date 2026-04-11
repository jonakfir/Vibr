"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FadeInOnScroll } from "./motion-utils";

const codeLines = [
  { prompt: true, text: "vibr-local init ./my-saas" },
  { prompt: false, text: "  Scanning project structure..." },
  { prompt: false, text: "  Found: Next.js + TypeScript + Tailwind" },
  { prompt: false, text: "  Loading context from 23 files" },
  { prompt: false, text: "" },
  { prompt: true, text: "vibr-local connect --model claude-3.5-sonnet" },
  { prompt: false, text: "  Connected via your API key" },
  { prompt: false, text: "  Model: claude-3.5-sonnet (Anthropic)" },
  { prompt: false, text: "" },
  { prompt: true, text: "vibr-local build --from-prompt" },
  { prompt: false, text: "  Generating implementation plan..." },
  { prompt: false, text: "  Writing src/components/Dashboard.tsx" },
  { prompt: false, text: "  Writing src/lib/api.ts" },
  { prompt: false, text: "  All files committed to your repo" },
];

export default function CodingInterface() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= codeLines.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section className="relative py-32 bg-background/70">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(120,180,255,0.04),transparent_70%)] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeInOnScroll direction="left">
            <h2 className="font-heading font-light text-title text-foreground">
              Your files. Your model.
              <br />
              <span className="bg-gradient-to-r from-foreground to-foreground/40 bg-clip-text text-transparent">
                Your build.
              </span>
            </h2>
            <div className="mt-8 space-y-4">
              <p className="font-body font-light text-body text-muted leading-relaxed">
                vibr-local connects directly to your project files. Point it at any
                directory and it understands your stack, your patterns, your
                conventions.
              </p>
              <p className="font-body font-light text-body text-muted leading-relaxed">
                Bring your own API key for any supported model — Claude, GPT-4,
                Gemini, or local models via Ollama. No lock-in.
              </p>
              <p className="font-body font-light text-body text-muted leading-relaxed">
                Everything runs on your machine, committed to your repo.
              </p>
            </div>
          </FadeInOnScroll>

          {/* Terminal */}
          <FadeInOnScroll direction="right" delay={0.2}>
            <div ref={ref} className="relative group">
              {/* Terminal glow */}
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <span className="ml-3 font-mono text-[11px] text-muted/40">terminal</span>
                </div>
                {/* Code */}
                <div className="p-4 font-mono text-[13px] leading-6 min-h-[340px]">
                  {codeLines.slice(0, visibleLines).map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {line.prompt ? (
                        <span>
                          <span className="text-foreground/40">$</span>{" "}
                          <span className="text-foreground">{line.text}</span>
                        </span>
                      ) : (
                        <span className="text-muted/60">{line.text}</span>
                      )}
                    </motion.div>
                  ))}
                  {visibleLines < codeLines.length && isInView && (
                    <motion.span
                      className="inline-block w-2 h-4 bg-foreground/60 ml-1"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
