"use client";

import { motion } from "framer-motion";
import { GhostButton } from "@/components/ui/ghost-button";
import { ParticleField } from "./particle-field";

const lines = [
  { number: "01", text: "Build it." },
  { number: "02", text: "Ship it." },
  { number: "03", text: "Find someone to sell it." },
];

const lineVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: i * 0.15,
    },
  }),
};

const totalHeadlineDelay = lines.length * 0.15 + 0.8;

const fadeIn = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", delay },
  },
});

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center">
      <ParticleField />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 w-full flex flex-col items-center justify-center text-center">
        <h1 className="font-heading font-light text-display md:text-hero-lg text-foreground">
          {lines.map((line, i) => (
            <motion.span
              key={i}
              className="block"
              custom={i}
              initial="hidden"
              animate="visible"
              variants={lineVariant}
            >
              <span className="font-body text-[14px] text-muted/50 tracking-widest uppercase mr-4 align-middle">
                {line.number}
              </span>
              {line.text}
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mt-8 font-body font-light text-body text-muted max-w-[520px]"
          initial="hidden"
          animate="visible"
          variants={fadeIn(totalHeadlineDelay)}
        >
          Vibr turns your skills into a product, a prompt, and finds a marketer
          who will grow it.
        </motion.p>

        <motion.div
          className="mt-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn(totalHeadlineDelay + 0.3)}
        >
          <GhostButton href="/onboarding">Start building</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
