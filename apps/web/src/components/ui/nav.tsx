"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { GhostButton } from "./ghost-button";

const NAV_LINKS = [
  { label: "Founders", href: "/founders" },
  { label: "Pricing", href: "/pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <motion.nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-500",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "border-b border-transparent"
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading font-light text-[20px] text-foreground"
        >
          Vibr
        </Link>

        <div className="flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={handleSignIn}
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
          >
            Sign in
          </button>

          <GhostButton href="/onboarding">Start building</GhostButton>
        </div>
      </div>
    </motion.nav>
  );
}
