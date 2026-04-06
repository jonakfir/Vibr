"use client";

import { SectionReveal } from "@/components/ui/section-reveal";
import { GhostButton } from "@/components/ui/ghost-button";

export function Closing() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <SectionReveal>
          <h2 className="font-heading font-light text-[64px] md:text-hero-lg text-foreground leading-none">
            Your next product
            <br />
            is waiting.
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div className="mt-8 flex justify-center">
            <GhostButton href="/onboarding">Start building</GhostButton>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
