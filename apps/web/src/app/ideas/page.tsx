import type { Metadata } from "next";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

export const metadata: Metadata = {
  title: "AI Startup Idea Generator Based on Your Skills | Vibr",
  description:
    "Generate personalized AI business ideas based on your skills, interests, and experience. Vibr's AI startup idea generator delivers tailored SaaS concepts with market analysis so you can start building today.",
  openGraph: {
    title: "AI Startup Idea Generator Based on Your Skills | Vibr",
    description:
      "Generate personalized AI business ideas based on your skills, interests, and experience. Vibr's AI startup idea generator delivers tailored SaaS concepts with market analysis.",
    type: "website",
  },
};

export default function IdeasPage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="font-heading font-light text-5xl md:text-7xl text-foreground leading-tight">
            AI Startup Idea Generator
            <br />
            Based on Your Skills
          </h1>
          <p className="mt-8 font-body font-light text-lg text-muted max-w-[600px] mx-auto">
            Stop scrolling through generic listicles. Vibr analyzes your unique
            skills, interests, and experience to generate SaaS business ideas
            that you can actually build.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">
              Generate your ideas
            </GhostButton>
          </div>
        </div>
      </section>

      {/* How the AI works */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            How the AI Business Idea Generator Works
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            Vibr asks you a few focused questions about your technical skills,
            domain knowledge, and the kind of work you enjoy. It then cross-
            references your profile against real market signals — trending
            niches, underserved verticals, and emerging API ecosystems — to
            surface ideas that sit squarely in your zone of competence.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            No random brainstorming. Every idea is grounded in what you already
            know how to do, so the gap between concept and first commit is as
            small as possible.
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Personalized Business Ideas with Market Analysis
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            Each idea arrives as a detailed card containing a product name, a
            one-line pitch, target audience, competitive landscape snapshot, and
            a rough estimate of market size. You also get a suggested tech stack
            based on the skills you told us about, plus a Claude Code prompt
            ready to scaffold the project.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Swipe through your ideas, bookmark the ones that resonate, and dive
            deeper with a single click. Vibr gives you three to five curated
            concepts — not a firehose of noise.
          </p>
        </div>
      </section>

      {/* Vibe coding ideas */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Vibe Coding Ideas for Developers Who Want to Ship
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            If you are a developer who knows how to code but has no idea what to
            build, you are not alone. Vibr was made for exactly this moment.
            Instead of spending weeks in analysis paralysis, run the idea
            generator once, pick the concept that excites you most, and start
            vibe coding the same afternoon.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            The transition from confused to focused is the hardest part of any
            side project. Vibr collapses that gap by giving you something
            concrete to say yes to — complete with a market rationale so you
            know there are real people waiting for what you build.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Ready to Find Your Next Idea?
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted max-w-[520px] mx-auto">
            Tell Vibr what you know. Get back a business idea you can start
            building today.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">Start building</GhostButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
