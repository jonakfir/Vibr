"use client";

import { motion } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

const FREE_FEATURES = [
  "3 idea generations per month",
  "Basic profile setup",
  "Community access",
  "Single session at a time",
  "No marketer matching",
  "No outreach tools",
];

const PRO_FEATURES = [
  "Unlimited idea generations",
  "AI-powered vibe coding with your own API keys",
  "Marketer matching and cold email outreach",
  "Full vibr-local access",
  "Domain availability checks",
  "Unlimited concurrent sessions",
  "Priority support",
  "7-day free trial, no card required",
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background py-32">
        <div className="max-w-[960px] mx-auto px-6">
          {/* Price */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-baseline justify-center">
              <span className="font-heading font-light text-hero text-foreground">
                $29
              </span>
              <span className="font-heading font-light text-subtitle text-muted ml-2">
                /mo
              </span>
            </div>
          </motion.div>

          {/* Comparison */}
          <motion.div
            className="mt-24 grid grid-cols-2 gap-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Free */}
            <div className="pr-16 border-r border-border">
              <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
                Free
              </h2>
              <div className="space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <p
                    key={feature}
                    className="font-body text-body text-muted leading-relaxed"
                  >
                    {feature}
                  </p>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div className="pl-16">
              <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
                Pro
              </h2>
              <div className="space-y-3">
                {PRO_FEATURES.map((feature) => (
                  <p
                    key={feature}
                    className="font-body text-body text-foreground leading-relaxed"
                  >
                    {feature}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-20 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GhostButton href="/onboarding">Start your trial</GhostButton>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
