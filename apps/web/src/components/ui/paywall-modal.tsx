"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  used: number;
  limit: number;
}

export function PaywallModal({ open, onClose, feature, used, limit }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-card-border rounded-[4px] max-w-md w-full p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-6">
              <button type="button" onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="font-heading font-light text-subtitle text-foreground mb-4">
              You&rsquo;ve reached the limit.
            </h2>

            <p className="font-body text-body text-muted mb-2">
              {used} of {limit} free {feature.replace(/_/g, " ")}s used this month.
            </p>

            <p className="font-body text-small text-muted mb-10">
              Upgrade to Pro for unlimited access to all features including the IDE, deployment, and marketer outreach.
            </p>

            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-heading font-light text-display text-foreground">$29</span>
              <span className="font-body text-small text-muted">/mo</span>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="font-body text-small text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors duration-300 disabled:opacity-50 group"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
