"use client";

import { useState } from "react";
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
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(false);
    }
  };

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
                $49
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
            className="mt-20 flex justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GhostButton href="/onboarding">Start free</GhostButton>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="font-body text-small text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors duration-300 disabled:opacity-30"
            >
              {upgrading ? "Redirecting..." : "Upgrade to Pro"} &rarr;
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
