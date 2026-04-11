"use client";

import { motion } from "framer-motion";
import { FadeInOnScroll, GlowCard, StaggerChildren, staggerItem } from "./motion-utils";

const ideas = [
  {
    name: "CodeReview Bot",
    category: "Developer Tools",
    desc: "An AI-powered code review assistant that catches bugs, suggests refactors, and enforces style guides across your repos.",
    market: "$4.2B",
    time: "3 weeks to MVP",
    competition: "Medium",
  },
  {
    name: "Thumbnail AI",
    category: "Creator Tools",
    desc: "Generate scroll-stopping YouTube thumbnails using AI trained on top-performing content in your niche.",
    market: "$1.8B",
    time: "2 weeks to MVP",
    competition: "Growing",
  },
  {
    name: "MeetingMind",
    category: "Productivity",
    desc: "An AI note-taker that joins your meetings, extracts action items, and syncs them to your project management tools.",
    market: "$6.1B",
    time: "4 weeks to MVP",
    competition: "High",
  },
];

export default function IdeasShowcase() {
  return (
    <section className="relative py-32 bg-background/85 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6">
        <FadeInOnScroll>
          <h2 className="font-heading font-light text-display text-foreground">
            What you&apos;ll get.
          </h2>
        </FadeInOnScroll>

        <div className="mt-16 flex flex-col md:flex-row items-start gap-6">
          {/* Featured card */}
          <FadeInOnScroll delay={0.1} className="w-full md:w-[380px] flex-shrink-0">
            <GlowCard>
              <div className="p-6 flex flex-col justify-between min-h-[320px]">
                <div>
                  <span className="font-body text-[10px] uppercase tracking-widest text-muted/60">
                    {ideas[0].category}
                  </span>
                  <h3 className="font-heading font-light text-[32px] text-foreground mt-2">
                    {ideas[0].name}
                  </h3>
                  <p className="font-body text-small text-muted mt-3 leading-relaxed">
                    {ideas[0].desc}
                  </p>
                </div>
                <div className="mt-6 flex justify-between items-end">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-wide text-muted/50">market size</p>
                    <p className="font-heading text-[28px] text-foreground">{ideas[0].market}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-[10px] uppercase tracking-wide text-muted/50">timeline</p>
                    <p className="font-body text-small text-foreground/80">{ideas[0].time}</p>
                  </div>
                </div>
              </div>
            </GlowCard>
          </FadeInOnScroll>

          {/* Side cards */}
          <StaggerChildren stagger={0.12} className="flex-1 flex flex-col gap-4 w-full">
            {ideas.slice(1).map((idea) => (
              <motion.div key={idea.name} variants={staggerItem}>
                <GlowCard>
                  <div className="p-6 flex flex-col justify-between min-h-[150px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-body text-[10px] uppercase tracking-widest text-muted/60">
                          {idea.category}
                        </span>
                        <h3 className="font-heading font-light text-[24px] text-foreground mt-1">
                          {idea.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-[24px] text-foreground">{idea.market}</p>
                        <p className="font-body text-[10px] text-muted/50">{idea.time}</p>
                      </div>
                    </div>
                    <p className="font-body text-small text-muted mt-3 leading-relaxed">
                      {idea.desc}
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </StaggerChildren>
        </div>

        <FadeInOnScroll delay={0.3} className="mt-8 flex justify-center">
          <a
            href="/onboarding"
            className="font-body text-small text-muted hover:text-foreground transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
          >
            See all ideas tailored to you &rarr;
          </a>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
