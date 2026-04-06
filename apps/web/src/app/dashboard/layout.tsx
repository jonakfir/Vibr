"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

function DashboardNav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <motion.nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-500",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border"
          : "border-b border-transparent"
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
          <Link
            href="/onboarding"
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
          >
            New Session
          </Link>
          <Link
            href="/download"
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
          >
            Download
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="pt-16">{children}</div>
    </div>
  );
}
