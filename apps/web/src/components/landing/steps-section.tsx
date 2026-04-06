"use client";

import { SectionReveal } from "@/components/ui/section-reveal";

const steps = [
  {
    number: "01",
    name: "Profile",
    description: "Share your skills, experience, and what fires you up.",
  },
  {
    number: "02",
    name: "Ideate",
    description:
      "AI-generated business ideas matched to your exact strengths.",
  },
  {
    number: "03",
    name: "Build",
    description:
      "A tailored prompt + local coding interface. Your files, your model.",
  },
  {
    number: "04",
    name: "Launch",
    description:
      "We find marketers who match your product and draft the outreach.",
  },
];

export function StepsSection() {
  return (
    <section className="w-full py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        {steps.map((step, i) => (
          <SectionReveal key={step.number} delay={i * 0.1}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-baseline py-8 border-b border-border gap-4">
              <span className="font-body text-xs text-muted uppercase tracking-wide shrink-0">
                {step.number}
              </span>
              <span className="font-heading text-subtitle text-foreground md:flex-1 md:text-center">
                {step.name}
              </span>
              <p className="font-body text-small text-muted max-w-[400px] md:text-right">
                {step.description}
              </p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </section>
  );
}
