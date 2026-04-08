import type { Metadata } from "next";
import { Nav } from '@/components/ui/nav';
import { Footer } from '@/components/ui/footer';
import { Hero } from '@/components/landing/hero';
import { WhatItIs } from '@/components/landing/what-it-is';
import { StepsSection } from '@/components/landing/steps-section';
import { IdeasShowcase } from '@/components/landing/ideas-showcase';
import { CodingInterface } from '@/components/landing/coding-interface';
import { MarketerSection } from '@/components/landing/marketer-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { Closing } from '@/components/landing/closing';

export const metadata: Metadata = {
  title: "Vibr — Build it. Ship it. Find someone to sell it.",
  keywords: [
    "AI startup idea generator",
    "vibe coding tool",
    "AI business ideas",
    "BYOK AI coding",
    "find marketers for SaaS",
    "AI cold email generator",
    "local AI coding tool",
    "vibr-local",
  ],
};

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />
      <Hero />
      <WhatItIs />
      <StepsSection />
      <IdeasShowcase />
      <CodingInterface />
      <MarketerSection />
      <PricingSection />
      <Closing />
      <Footer />
    </main>
  );
}
