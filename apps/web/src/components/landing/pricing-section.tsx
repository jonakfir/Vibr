"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { FadeInOnScroll } from "./motion-utils";

const features = [
  "Unlimited idea generations",
  "AI-powered vibe coding with your own API keys",
  "Marketer matching & outreach drafts",
  "Local IDE integration",
  "Priority support",
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 bg-background/70">
      <div className="max-w-[1200px] mx-auto px-6">
        <FadeInOnScroll>
          <div
            ref={ref}
            className="relative max-w-[600px] mx-auto"
          >
            {/* Glow border */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.1] via-white/[0.03] to-transparent" />
            <div className="relative bg-[#050505] rounded-2xl p-10 border border-white/[0.04]">
              <p className="font-body text-[10px] uppercase tracking-widest text-muted/50 mb-4">
                Everything you need
              </p>
              <div className="flex items-baseline gap-2">
                <motion.span
                  className="font-heading font-light text-[72px] text-foreground leading-none"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  $49
                </motion.span>
                <span className="font-body text-muted/60">/mo</span>
              </div>

              <p className="font-body font-light text-body text-muted mt-4 leading-relaxed">
                Everything you need. Unlimited idea generations, AI-powered vibe
                coding with your own API keys, marketer matching, and outreach drafts.
              </p>

              <ul className="mt-8 space-y-3">
                {features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    className="flex items-center gap-3 font-body text-small text-foreground/70"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                  >
                    <span className="w-1 h-1 rounded-full bg-foreground/40" />
                    {feature}
                  </motion.li>
                ))}
              </ul>

              <motion.div
                className="mt-10"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Link
                  href="/onboarding"
                  className="group relative inline-flex items-center justify-center w-full gap-2 px-8 py-4 font-body text-sm tracking-wide text-background bg-foreground rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(242,239,233,0.12)]"
                >
                  <span className="relative z-10">Start your trial</span>
                  <span className="relative z-10">&rarr;</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
