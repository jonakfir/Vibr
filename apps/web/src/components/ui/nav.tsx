"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { label: "Ideas", href: "/ideas" },
  { label: "IDE", href: "/local-ide" },
  { label: "Marketers", href: "/find-marketers" },
  { label: "Pricing", href: "/pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 border-b ${
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-heading font-light text-[28px] text-foreground">
          Vibr
        </Link>

        <div className="flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300 hidden md:block"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/auth"
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300 hidden md:block"
          >
            Sign in
          </Link>

          <Link
            href="/onboarding"
            className="group inline-flex items-center gap-1.5 font-body text-nav uppercase tracking-wide text-foreground hover:text-accent transition-colors duration-300"
          >
            Start building
            <span className="group-hover:translate-x-0.5 transition-transform duration-200">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
