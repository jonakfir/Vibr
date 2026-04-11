"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const HARDCODED_ADMIN_EMAILS = [
  "jonakfir@gmail.com",
  "jonakfir@berkeley.edu",
];

const links = [
  { label: "Ideas", href: "/ideas" },
  { label: "IDE", href: "/local-ide" },
  { label: "Marketers", href: "/find-marketers" },
  { label: "Pricing", href: "/pricing" },
];

type NavUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
} | null;

export function Nav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<NavUser>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subscribe to auth state so the nav always reflects who is signed in.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const applyUser = (u: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    } | null) => {
      if (!u) {
        if (!cancelled) setUser(null);
        return;
      }
      const meta = (u.user_metadata || {}) as Record<string, unknown>;
      const fullName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        null;
      const avatar =
        (typeof meta.avatar_url === "string" && meta.avatar_url) || null;
      if (!cancelled) {
        setUser({
          id: u.id,
          email: u.email ?? null,
          full_name: fullName,
          avatar_url: avatar,
        });
      }
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applyUser(session?.user ?? null);
      }
    );
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Close the menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-nav-menu]")) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isAdmin = !!user?.email
    ? HARDCODED_ADMIN_EMAILS.includes(user.email.toLowerCase())
    : false;

  const displayName =
    user?.full_name || (user?.email ? user.email.split("@")[0] : "");
  const initial = (displayName?.[0] || "?").toUpperCase();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 border-b ${
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading font-light text-[44px] leading-none text-foreground tracking-tight"
        >
          Vibr
        </Link>

        <div className="flex items-center gap-10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-[13px] uppercase tracking-[0.18em] text-muted hover:text-foreground transition-colors duration-300 hidden md:block"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="relative" data-nav-menu>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="group flex items-center gap-3"
              >
                {/* Avatar with an always-visible green dot so there's no doubt
                    that the user is signed in, even on mobile where the name
                    label is hidden. */}
                <div className="relative">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full border border-border bg-background/60 flex items-center justify-center font-heading text-[15px] text-foreground">
                      {initial}
                    </div>
                  )}
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background"
                  />
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="font-body text-[12px] uppercase tracking-[0.15em] text-foreground truncate max-w-[160px]">
                    {displayName}
                  </span>
                  <span className="font-body text-[10px] uppercase tracking-[0.15em] text-emerald-400">
                    {isAdmin ? "Admin \u00b7 Signed in" : "Signed in"}
                  </span>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-3 w-[240px] bg-background/95 backdrop-blur-md border border-border shadow-2xl">
                  <div className="px-5 py-4 border-b border-border">
                    <p className="font-body text-[13px] text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="font-body text-[11px] text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.15em] text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.15em] text-foreground hover:bg-foreground/5 transition-colors"
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.15em] text-foreground hover:bg-foreground/5 transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-5 py-2.5 font-body text-[12px] uppercase tracking-[0.15em] text-muted hover:bg-foreground/5 hover:text-foreground transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth"
                className="font-body text-[13px] uppercase tracking-[0.18em] text-muted hover:text-foreground transition-colors duration-300 hidden md:block"
              >
                Sign in
              </Link>

              <Link
                href="/onboarding"
                className="group inline-flex items-center gap-1.5 font-body text-[13px] uppercase tracking-[0.18em] text-foreground hover:text-accent transition-colors duration-300"
              >
                Start building
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  &rarr;
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;
