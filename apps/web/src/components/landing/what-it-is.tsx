"use client";

import { SectionReveal } from "@/components/ui/section-reveal";

export function WhatItIs() {
  return (
    <section className="w-full py-32 border-t border-border">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col items-center text-center gap-12">
        <SectionReveal>
          <h2 className="font-heading font-light text-title md:text-display text-foreground">
            You have the skills.
            <br />
            We&rsquo;ll show you what to build.
          </h2>
        </SectionReveal>

        <SectionReveal delay={0.15}>
          <p className="font-body font-light text-body text-muted max-w-[640px]">
            Tell us who you are&nbsp;&mdash; your skills, your interests, what
            excites you. Our AI analyzes your profile and generates business
            ideas uniquely matched to what you can build. Choose one, and
            we&rsquo;ll write the perfect prompt to build it with your favorite
            AI coding tool. Then we&rsquo;ll find the growth marketers who can
            take it to market.
          </p>
        </SectionReveal>
      </div>
    </section>
  );
}
