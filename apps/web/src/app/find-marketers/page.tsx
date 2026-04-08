"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
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

const mockMarketers = [
  {
    name: "Sarah Chen",
    role: "Growth Lead @ TechCrunch",
    match: 94,
    tags: "SaaS, Developer Tools, B2B Growth",
  },
  {
    name: "Marcus Rivera",
    role: "Content Strategist @ Product Hunt",
    match: 87,
    tags: "Product Launches, Indie Hackers, Startups",
  },
  {
    name: "Leila Osman",
    role: "Tech Journalist @ The Verge",
    match: 82,
    tags: "AI, Consumer Tech, Deep Dives",
  },
];

const steps = [
  {
    num: "01",
    title: "Describe your product",
    desc: "Tell Vibr what you built, who it&apos;s for, and what makes it different.",
  },
  {
    num: "02",
    title: "AI scans LinkedIn profiles",
    desc: "Our model searches thousands of profiles for people who cover or promote products like yours.",
  },
  {
    num: "03",
    title: "Ranked by relevance",
    desc: "Each result comes with a match score so you know exactly who to contact first.",
  },
];

const qualities = [
  "They&apos;ve written about or promoted products in your space before",
  "Their audience overlaps with your target customers",
  "They&apos;re actively posting and engaging, not dormant accounts",
  "Their tone and style align with your brand",
  "They have a track record of driving real traffic, not just vanity metrics",
];

export default function FindMarketersPage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <Section className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="font-heading font-light text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] text-foreground mb-6">
          Find the People Who Will
          <br />
          Sell It For You
        </h1>
        <p className="font-body text-base text-muted max-w-xl mx-auto leading-relaxed">
          Vibr uses AI to scan LinkedIn and match your product with marketers,
          journalists, and influencers who already care about your space. No
          guessing, no cold lists&nbsp;&mdash; just ranked results.
        </p>
        <div className="mt-10">
          <GhostButton href="/login">Start matching</GhostButton>
        </div>
      </Section>

      {/* Mockup: marketer cards */}
      <Section className="max-w-5xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mockMarketers.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.15,
              }}
            >
              <motion.div
                className="bg-[#111] border border-[#222] rounded-[4px] p-6 cursor-default"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#222]" />
                  <div>
                    <p className="font-heading text-lg text-foreground">
                      {m.name}
                    </p>
                    <p className="text-xs text-muted">{m.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-heading text-3xl text-foreground">
                    {m.match}
                  </span>
                  <span className="text-xs text-muted uppercase tracking-wider">
                    % match
                  </span>
                </div>
                <p className="text-xs text-muted mt-3">{m.tags}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How Matching Works */}
      <Section className="max-w-4xl mx-auto px-6 pb-28">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-14 text-center">
          How Matching Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              className="bg-[#111] border border-[#222] rounded-[4px] p-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                delay: i * 0.15,
              }}
              whileHover={{ scale: 1.02 }}
            >
              <span className="font-heading text-5xl text-foreground/10">
                {s.num}
              </span>
              <h3 className="font-heading text-xl text-foreground mt-4 mb-2">
                {s.title}
              </h3>
              <p
                className="text-sm text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: s.desc }}
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* What Makes a Good Match */}
      <Section className="max-w-3xl mx-auto px-6 pb-28">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-14 text-center">
          What Makes a Good Match
        </h2>
        <ul className="divide-y divide-[#222]">
          {qualities.map((q, i) => (
            <motion.li
              key={i}
              className="py-5 text-sm text-muted leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: i * 0.1,
              }}
              dangerouslySetInnerHTML={{ __html: q }}
            />
          ))}
        </ul>
      </Section>

      {/* CTA */}
      <Section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="font-heading font-light text-[clamp(1.8rem,3.5vw,2.8rem)] text-foreground mb-6">
          Stop Guessing Who to Reach Out To
        </h2>
        <p className="text-sm text-muted max-w-md mx-auto mb-10 leading-relaxed">
          Let AI find the marketers who are already interested in what
          you&apos;re building. You focus on the product.
        </p>
        <GhostButton href="/login">Find your marketers</GhostButton>
      </Section>

      {/* Explore more */}
      <Section className="max-w-4xl mx-auto px-6 pb-32">
        <div className="border-t border-[#222] pt-12">
          <p className="text-xs text-muted uppercase tracking-wider mb-6 text-center">
            Explore more
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <GhostButton href="/outreach">AI Cold Emails</GhostButton>
            <GhostButton href="/ideas">Startup Idea Generator</GhostButton>
            <GhostButton href="/local-ide">Local AI IDE</GhostButton>
          </div>
        </div>
      </Section>

      <Footer />
    </main>
  );
}
