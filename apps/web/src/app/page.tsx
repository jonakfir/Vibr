import Hero from "@/components/landing/hero";
import WhatItIs from "@/components/landing/what-it-is";
import StepsSection from "@/components/landing/steps-section";
import IdeasShowcase from "@/components/landing/ideas-showcase";
import CodingInterface from "@/components/landing/coding-interface";
import MarketerSection from "@/components/landing/marketer-section";
import PricingSection from "@/components/landing/pricing-section";
import Closing from "@/components/landing/closing";
import ParticleField from "@/components/landing/particle-field";
import GlobalReveal from "@/components/landing/global-reveal";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Fixed canvas behind everything — advances through 192 frames as the
          user scrolls the entire page. */}
      <GlobalReveal />
      <ParticleField />

      {/* All page content sits above the canvas. */}
      <div className="relative z-10">
        <Hero />
        <WhatItIs />
        <StepsSection />
        <IdeasShowcase />
        <CodingInterface />
        <MarketerSection />
        <PricingSection />
        <Closing />
      </div>
    </main>
  );
}
