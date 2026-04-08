import type { Metadata } from "next";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

export const metadata: Metadata = {
  title: "AI Cold Email Generator for Startup Outreach",
  description:
    "Generate personalized cold emails for startup outreach with AI. Vibr finds relevant marketers, writes tailored emails with subject lines, and lets you edit and send — powered by Firstline.",
  alternates: {
    canonical: "https://vibr-ai.com/outreach",
  },
  openGraph: {
    title: "AI Cold Email Generator for Startup Outreach",
    description:
      "Generate personalized cold emails for startup outreach with AI. Vibr finds marketers, writes tailored emails, and lets you send — all in one flow.",
    type: "website",
  },
};

export default function OutreachPage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="font-heading font-light text-5xl md:text-7xl text-foreground leading-tight">
            AI Cold Email Generator{" "}
            <br />
            for Startup Outreach
          </h1>
          <p className="mt-8 font-body font-light text-lg text-muted max-w-[600px] mx-auto">
            Vibr finds the right marketers for your product, writes personalized
            cold emails, and lets you send them — all from one screen. No
            templates. Every email is unique.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">
              Start your outreach
            </GhostButton>
          </div>
        </div>
      </section>

      {/* The flow */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            AI Outreach Emails That Actually Get Replies
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            Generic cold emails get ignored. Vibr writes each email from
            scratch using the recipient&apos;s LinkedIn profile, past work, and
            industry context. The result reads like something a human spent
            twenty minutes composing — because the AI has real data to work
            with, not just a mail-merge template.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Every email includes a compelling subject line, a personalized
            opening that references the marketer&apos;s background, a concise pitch
            for your product, and a low-friction call to action.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Automated Cold Email Workflow for SaaS Founders
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            The workflow is simple. First, Vibr identifies marketers who match
            your product&apos;s sector using AI-powered LinkedIn scanning. Then it
            generates a personalized cold email for each match. You review each
            draft in an inline editor — tweak the tone, adjust the ask, or send
            as-is.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            The entire pipeline runs in your browser. No CSV exports, no
            third-party sequencing tools, no context switching. From discovery to
            sent email in a single session.
          </p>
        </div>
      </section>

      {/* Powered by Firstline */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Startup Outreach Tool Powered by Firstline
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            Under the hood, Vibr&apos;s outreach engine is powered by Firstline — a
            personalization layer that analyzes each recipient&apos;s digital
            footprint to craft opening lines with high reply rates. Firstline
            ensures that every email feels hand-written, not automated.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Combined with Vibr&apos;s marketer-matching AI, you get an end-to-end
            system: find the right people, say the right thing, and start the
            conversation that turns your product into a business.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Your First Outreach Campaign in Minutes
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted max-w-[520px] mx-auto">
            Describe your product, let Vibr find the marketers, and send
            personalized emails today.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">Start building</GhostButton>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-16 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <p className="font-body text-xs text-muted uppercase tracking-[0.2em] mb-6">Explore more</p>
          <div className="flex flex-wrap gap-8">
            <a href="/ideas" className="font-body text-sm text-foreground hover:underline">AI Idea Generator</a>
            <a href="/local-ide" className="font-body text-sm text-foreground hover:underline">Local AI IDE</a>
            <a href="/find-marketers" className="font-body text-sm text-foreground hover:underline">Find Marketers</a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
