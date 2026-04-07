"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { GhostButton } from "./ghost-button";

const NAV_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Download", href: "/download" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
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

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSignIn}
                className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
              >
                Sign in
              </button>
              <GhostButton href="/onboarding">Start building</GhostButton>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
