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

const steps = [
  {
    num: "01",
    title: "Enter your profile",
    desc: "Skills, interests, domain expertise, and years of experience.",
  },
  {
    num: "02",
    title: "AI generates ideas",
    desc: "Five tailored SaaS concepts with market data and tech stacks.",
  },
  {
    num: "03",
    title: "Pick one and build",
    desc: "Select your favorite, name it, and start coding the same day.",
  },
];

const mockIdeas = [
  {
    sector: "Developer Tools",
    name: "CodeReview Bot",
    desc: "AI-powered code review tool that integrates with GitHub PRs and catches bugs before they ship.",
    market: "$2.4B",
    difficulty: "Medium",
    rotate: "-1deg",
  },
  {
    sector: "E-Commerce",
    name: "ShopLens",
    desc: "Visual search engine for online stores that lets customers find products by uploading a photo.",
    market: "$5.1B",
    difficulty: "Hard",
    rotate: "0deg",
  },
  {
    sector: "Healthcare",
    name: "TriageAI",
    desc: "Symptom-checking chatbot for clinics that reduces front-desk workload by 40%.",
    market: "$3.8B",
    difficulty: "Medium",
    rotate: "1deg",
  },
];

const features = [
  "Five personalized SaaS ideas based on your exact skill set",
  "Market size estimates and competitive landscape for each concept",
  "Suggested tech stack matched to the languages and frameworks you know",
  "One-line pitch and target audience breakdown",
  "A ready-to-use Claude Code prompt to scaffold the project instantly",
];

export default function IdeasPage() {
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
            <GhostButton href="/onboarding">Generate your ideas</GhostButton>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-14">
            How the AI Business Idea Generator Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className="bg-[#111] border border-[#222] rounded-[4px] p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-heading font-light text-5xl text-[#222] select-none">
                  {step.num}
                </p>
                <h3 className="font-heading font-light text-xl text-foreground mt-4">
                  {step.title}
                </h3>
                <p className="font-body font-light text-sm text-muted mt-3 leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Mockup: Idea Cards */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-6">
            Personalized Business Ideas with Market Analysis
          </h2>
          <p className="font-body font-light text-base text-muted leading-relaxed max-w-[700px] mb-14">
            Each idea arrives as a detailed card containing a product name, target
            audience, competitive landscape, and a suggested tech stack. Here&apos;s
            what that looks like.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {mockIdeas.map((idea, i) => (
              <motion.div
                key={idea.name}
                className="bg-[#111] border border-[#222] rounded-[4px] p-6 cursor-default"
                style={{ rotate: idea.rotate }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.15 }}
                whileHover={{ scale: 1.02, rotate: "0deg" }}
                animate={{ y: [0, -8, 0] }}
              >
                <p className="text-xs text-muted uppercase tracking-[0.15em] font-body">
                  {idea.sector}
                </p>
                <h3 className="font-heading font-light text-2xl text-foreground mt-2">
                  {idea.name}
                </h3>
                <p className="text-sm text-muted mt-3 font-body font-light leading-relaxed">
                  {idea.desc}
                </p>
                <div className="flex gap-4 mt-4 text-xs text-muted font-body">
                  <span>Market: {idea.market}</span>
                  <span>Difficulty: {idea.difficulty}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* What you get */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground mb-12">
            What You Get
          </h2>
          <div className="divide-y divide-[#222]">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                className="py-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
              >
                <p className="font-body font-light text-base text-foreground">
                  {feat}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Vibe coding */}
      <Section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Vibe Coding Ideas for Developers Who Want to Ship
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            If you&apos;re a developer who knows how to code but has no idea what to
            build, you&apos;re not alone. Vibr was made for exactly this moment.
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
      </Section>

      {/* CTA */}
      <Section className="py-24 px-6 border-t border-[#222]">
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
      </Section>

      {/* Internal links */}
      <section className="py-16 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <p className="font-body text-xs text-muted uppercase tracking-[0.2em] mb-6">
            Explore more
          </p>
          <div className="flex flex-wrap gap-8">
            <a
              href="/local-ide"
              className="font-body text-sm text-foreground hover:underline"
            >
              Local AI IDE
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
