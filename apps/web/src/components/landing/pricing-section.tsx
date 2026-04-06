"use client";

import { SectionReveal } from "@/components/ui/section-reveal";
import { GhostButton } from "@/components/ui/ghost-button";

export function PricingSection() {
  return (
    <section className="relative py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <SectionReveal>
          <div className="flex items-baseline justify-center">
            <span className="font-heading font-light text-hero text-foreground">
              $29
            </span>
            <span className="font-heading font-light text-subtitle text-muted ml-2">
              /mo
            </span>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <p className="mt-8 font-body font-light text-body text-muted leading-relaxed max-w-[640px] mx-auto">
            Everything you need. Unlimited idea generations, AI-powered vibe
            coding with your own API keys, marketer matching and cold email
            outreach, full vibr-local access, and domain availability checks.
            Start with a 7-day free trial — no card required.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.3}>
          <div className="mt-8 flex justify-center">
            <GhostButton href="/onboarding">Start your trial</GhostButton>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
