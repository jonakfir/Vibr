"use client";

import { motion } from "framer-motion";
import { FadeInOnScroll, StaggerChildren, staggerItem, AnimatedCounter, GlowCard } from "./motion-utils";

const marketers = [
  { name: "Sarah Chen", role: "Growth Lead @ TechStartup", match: 94 },
  { name: "Marcus Rivera", role: "B2B SaaS Marketing", match: 87 },
  { name: "Anika Patel", role: "DevTools GTM Consultant", match: 82 },
];

export default function MarketerSection() {
  return (
    <section className="relative py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Marketer cards */}
          <StaggerChildren stagger={0.15} className="flex flex-col md:flex-row gap-4">
            {marketers.map((m) => (
              <motion.div key={m.name} variants={staggerItem} className="flex-1">
                <GlowCard className="h-full">
                  <div className="p-6 flex flex-col min-h-[280px]">
                    {/* Avatar placeholder */}
                    <div className="w-16 h-16 rounded-full bg-[#1E1E1E] border border-white/[0.06] mb-4 flex items-center justify-center">
                      <span className="font-heading text-lg text-foreground/60">
                        {m.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <h3 className="font-heading font-light text-[20px] text-foreground mb-1">
                      {m.name}
                    </h3>
                    <p className="font-body font-light text-small text-muted mb-6 max-w-[240px]">
                      {m.role}
                    </p>
                    <div className="mt-auto">
                      <p className="font-heading font-light text-[48px] leading-none text-foreground">
                        <AnimatedCounter target={m.match} suffix="%" />
                      </p>
                      <p className="font-body text-[10px] uppercase tracking-wide text-muted mt-1">
                        match
                      </p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </StaggerChildren>

          {/* Description */}
          <FadeInOnScroll direction="right" delay={0.3}>
            <h2 className="font-heading font-light text-title text-foreground">
              We find the people who will sell it for you.
            </h2>
            <div className="mt-8 space-y-4">
              <p className="font-body font-light text-body text-muted leading-relaxed">
                Once your product is built, Vibr scans LinkedIn to find marketers
                whose experience aligns with your sector, audience, and go-to-market
                strategy. Each match is scored by relevance, not popularity.
              </p>
              <p className="font-body font-light text-body text-muted leading-relaxed">
                Then it drafts personalized cold emails through Firstline — no
                templates, no spam. Real outreach built from their background and your
                product.
              </p>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
