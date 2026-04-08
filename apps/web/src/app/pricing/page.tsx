"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

const PRO_FEATURES = [
  "Unlimited AI-generated business ideas",
  "AI-powered vibe coding with your own API keys",
  "Marketer matching and cold email outreach",
  "Full vibr-local access — local files, terminal, git",
  "Domain availability checks",
  "One-click Vercel deploy",
  "Unlimited concurrent sessions",
  "Priority support",
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
        <div className="max-w-[700px] mx-auto px-6">
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
            <p className="mt-6 font-body text-body text-muted">
              Everything you need to go from idea to launched product.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="space-y-4">
              {PRO_FEATURES.map((feature) => (
                <p
                  key={feature}
                  className="font-body text-body text-foreground leading-relaxed border-b border-[#222] pb-4"
                >
                  {feature}
                </p>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="font-body text-base text-foreground border-b border-foreground pb-1 hover:text-accent hover:border-accent transition-colors duration-300 disabled:opacity-30"
            >
              {upgrading ? "Redirecting..." : "Get started"} &rarr;
            </button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
