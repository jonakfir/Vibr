import Hero from "@/components/landing/hero";
import ScrollReveal from "@/components/landing/scroll-reveal-frames";
import WhatItIs from "@/components/landing/what-it-is";
import StepsSection from "@/components/landing/steps-section";
import IdeasShowcase from "@/components/landing/ideas-showcase";
import CodingInterface from "@/components/landing/coding-interface";
import MarketerSection from "@/components/landing/marketer-section";
import PricingSection from "@/components/landing/pricing-section";
import Closing from "@/components/landing/closing";
import ParticleField from "@/components/landing/particle-field";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      <ParticleField />
      <Hero />
      <ScrollReveal />
      <WhatItIs />
      <StepsSection />
      <IdeasShowcase />
      <CodingInterface />
      <MarketerSection />
      <PricingSection />
      <Closing />
    </main>
  );
}
