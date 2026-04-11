"use client";

import { FadeInOnScroll } from "./motion-utils";

export default function WhatItIs() {
  return (
    <section className="w-full py-32 border-t border-white/[0.06] bg-background/85 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6">
        <FadeInOnScroll>
          <h2 className="font-heading font-light text-title text-foreground">
            You have the skills.
            <br />
            <span className="bg-gradient-to-r from-foreground to-foreground/40 bg-clip-text text-transparent">
              We&apos;ll show you what to build.
            </span>
          </h2>
        </FadeInOnScroll>
        <FadeInOnScroll delay={0.15}>
          <p className="font-body font-light text-body text-muted max-w-[600px] mt-8 leading-relaxed">
            Tell us who you are — your skills, your interests, what excites you. Our
            AI analyzes your profile against real market demand and generates business
            ideas tailored to what you can actually build and sell.
          </p>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
