"use client";

import { motion } from "framer-motion";
import { FadeInOnScroll, StaggerChildren, staggerItem } from "./motion-utils";

const steps = [
  {
    num: "01",
    title: "Profile",
    desc: "Share your skills, experience, and what fires you up.",
  },
  {
    num: "02",
    title: "Ideate",
    desc: "AI-generated business ideas matched to your exact strengths.",
  },
  {
    num: "03",
    title: "Build",
    desc: "A tailored prompt + local coding interface. Your files, your model.",
  },
  {
    num: "04",
    title: "Launch",
    desc: "We find marketers who match your product and draft the outreach.",
  },
];

export default function StepsSection() {
  return (
    <section className="w-full py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <StaggerChildren className="divide-y divide-white/[0.06]">
          {steps.map((step) => (
            <motion.div key={step.num} variants={staggerItem}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-baseline py-8 gap-4 group">
                <span className="font-body text-xs text-muted/60 uppercase tracking-wide shrink-0 group-hover:text-foreground/40 transition-colors duration-300">
                  {step.num}
                </span>
                <span className="font-heading text-subtitle text-foreground md:flex-1 md:text-center group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:to-foreground/60 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {step.title}
                </span>
                <p className="font-body text-small text-muted max-w-[400px] md:text-right group-hover:text-foreground/60 transition-colors duration-300">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
