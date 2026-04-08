"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const providers = [
  { name: "Anthropic", tag: "Claude" },
  { name: "OpenAI", tag: "GPT" },
  { name: "Gemini", tag: "Google" },
  { name: "Custom", tag: "Any endpoint" },
];

const features = [
  { icon: "\u25B6", title: "Terminal emulation", desc: "Full shell access connected to your local machine" },
  { icon: "\u25C9", title: "File watcher", desc: "Real-time sync between disk and browser editor" },
  { icon: "\u2387", title: "Git operations", desc: "Stage, commit, diff, and push without leaving the IDE" },
  { icon: "\u2750", title: "Folder picker", desc: "Open any project directory from your filesystem" },
];

export default function LocalIdePage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <motion.div
          className="max-w-[900px] mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="font-heading font-light text-5xl md:text-7xl text-foreground leading-tight">
            Your Files. Your Model.
            <br />
            Your Build.
          </h1>
          <p className="mt-8 font-body font-light text-lg text-muted max-w-[600px] mx-auto">
            vibr-local is a lightweight CLI that bridges your local filesystem
            to a full browser-based IDE. Bring your own API key. Keep your code
            on your machine.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">Try vibr-local</GhostButton>
          </div>
        </motion.div>
      </section>

      {/* IDE Mockup */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-6">
            A BYOK AI Coding IDE Connected to Your Local Files
          </h2>
          <p className="font-body font-light text-base text-muted leading-relaxed max-w-[700px] mb-14">
            vibr-local runs a small local server that exposes your project
            directory to the Vibr browser IDE over a secure tunnel. Here&apos;s
            what the workspace looks like.
          </p>

          <motion.div
            className="bg-[#0a0a0a] border border-[#222] rounded-[4px] overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.08)]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#222]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />
              <span className="text-xs text-muted ml-2 font-body">vibr-local</span>
            </div>
            {/* 3 panels */}
            <div className="flex h-[350px]">
              {/* Left: prompt */}
              <div className="w-1/4 border-r border-[#222] p-4">
                <p className="text-xs text-muted uppercase tracking-wider font-body">
                  Prompt
                </p>
                <div className="mt-3 space-y-2">
                  <div className="h-2 bg-[#1a1a1a] rounded w-full" />
                  <div className="h-2 bg-[#1a1a1a] rounded w-4/5" />
                  <div className="h-2 bg-[#1a1a1a] rounded w-3/5" />
                </div>
                <div className="mt-6 space-y-2">
                  <div className="h-2 bg-[#1a1a1a] rounded w-full" />
                  <div className="h-2 bg-[#1a1a1a] rounded w-2/3" />
                </div>
              </div>
              {/* Center: chat */}
              <div className="flex-1 border-r border-[#222] p-4">
                <div className="bg-[#111] rounded p-3 mb-3 max-w-[80%]">
                  <p className="text-xs text-muted font-body">
                    Create a Next.js API route for user auth...
                  </p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#222] rounded p-3 max-w-[80%] ml-auto">
                  <p className="text-xs text-foreground font-body">
                    Here&apos;s the auth route with JWT validation...
                  </p>
                </div>
                <div className="bg-[#111] rounded p-3 mt-3 max-w-[80%]">
                  <p className="text-xs text-muted font-body">
                    Now add rate limiting middleware...
                  </p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#222] rounded p-3 max-w-[80%] ml-auto mt-3">
                  <p className="text-xs text-foreground font-body">
                    Added express-rate-limit with a 100 req/15m window...
                  </p>
                </div>
              </div>
              {/* Right: files */}
              <div className="w-1/4 p-4">
                <p className="text-xs text-muted uppercase tracking-wider font-body">
                  Files
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-muted font-body">
                  <p>&#x1F4C1; src/</p>
                  <p className="pl-4">&#x1F4C1; app/</p>
                  <p className="pl-8 text-foreground">page.tsx</p>
                  <p className="pl-8">layout.tsx</p>
                  <p className="pl-4">&#x1F4C1; lib/</p>
                  <p className="pl-8">auth.ts</p>
                  <p className="pl-8">db.ts</p>
                  <p className="pl-4">&#x1F4C1; api/</p>
                  <p className="pl-8 text-foreground">route.ts</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* BYOK */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-4">
            BYOK — Bring Your Own Key
          </h2>
          <p className="font-body font-light text-base text-muted leading-relaxed mb-12">
            Your API key stays in your browser and is never stored on our servers.
            You choose the model, you control the cost.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {providers.map((p, i) => (
              <motion.div
                key={p.name}
                className="bg-[#111] border border-[#222] rounded-[4px] p-5 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-heading font-light text-xl text-foreground">
                  {p.name}
                </p>
                <p className="font-body text-xs text-muted mt-1">{p.tag}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Features */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-12">
            Terminal, File Browser, and Git Ops in the Browser
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="flex items-start gap-4 bg-[#111] border border-[#222] rounded-[4px] p-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="text-lg text-muted mt-0.5 shrink-0">{feat.icon}</span>
                <div>
                  <p className="font-body text-sm text-foreground font-medium">
                    {feat.title}
                  </p>
                  <p className="font-body text-sm text-muted mt-1 font-light leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Comparison */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Claude Code Alternative That Runs in Your Browser
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            If you like Claude Code but want a visual interface, vibr-local
            fills that gap. It gives you the same direct-to-filesystem AI coding
            experience with a proper editor, syntax highlighting, multi-file
            tabs, and a preview pane — all without leaving the browser.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Because everything is local-first, your code never touches our
            servers. The AI calls go straight from your browser to the provider
            using your key. It&apos;s the privacy-friendly way to use AI for
            development.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Start Coding Locally with AI
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted max-w-[520px] mx-auto">
            Install the CLI, plug in your API key, and open your project in the
            browser. It takes about two minutes.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">Get started</GhostButton>
          </div>
        </div>
      </Section>

      {/* Internal links */}
      <section className="py-16 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <p className="font-body text-xs text-muted uppercase tracking-[0.2em] mb-6">
            Explore more
          </p>
          <div className="flex flex-wrap gap-8">
            <a
              href="/ideas"
              className="font-body text-sm text-foreground hover:underline"
            >
              AI Idea Generator
            </a>
            <a
              href="/find-marketers"
              className="font-body text-sm text-foreground hover:underline"
            >
              Find Marketers
            </a>
            <a
              href="/outreach"
              className="font-body text-sm text-foreground hover:underline"
            >
              AI Outreach
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
