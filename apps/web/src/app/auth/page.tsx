"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // After any successful sign-in, we want to honor an optional ?next= param
  // from the middleware so the user lands where they originally tried to go.
  const getNextPath = () => {
    if (typeof window === "undefined") return "/onboarding";
    const params = new URLSearchParams(window.location.search);
    return params.get("next") || "/onboarding";
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next");
      const redirectTo = new URL("/auth/callback", window.location.origin);
      if (nextParam) redirectTo.searchParams.set("next", nextParam);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        // If email confirmation is on, the user needs to verify first.
        if (data.user && !data.session) {
          setInfo(
            "Check your inbox — we sent a confirmation link to finish signing up."
          );
          setLoading(false);
          return;
        }

        // If confirmations are off (auto-confirm), we have a session now.
        router.push(getNextPath());
        router.refresh();
        return;
      }

      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push(getNextPath());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="w-full max-w-[440px]">
          <h1 className="font-heading font-light text-[56px] md:text-[72px] leading-[0.95] text-foreground text-center">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-6 font-body text-muted text-[15px] text-center">
            {mode === "signin"
              ? "Welcome back. Pick up where you left off."
              : "Start turning your skills into a product."}
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-12 w-full inline-flex items-center justify-center gap-3 border border-border hover:border-foreground transition-colors duration-300 py-4 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#F2EFE9"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#F2EFE9"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#F2EFE9"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#F2EFE9"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-body text-[14px] uppercase tracking-[0.15em] text-foreground">
              {loading ? "Connecting..." : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="mt-10 mb-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            {mode === "signup" && (
              <div>
                <label className="block font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="name"
                  className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors duration-300 disabled:opacity-50"
                />
              </div>
            )}

            <div>
              <label className="block font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors duration-300 disabled:opacity-50"
              />
              {mode === "signup" && (
                <p className="mt-2 font-body text-[11px] text-muted">
                  At least 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center bg-foreground text-background py-4 px-6 font-body text-[14px] uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? mode === "signup"
                  ? "Creating..."
                  : "Signing in..."
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          {error && (
            <p className="mt-6 font-body text-[13px] text-red-400 text-center">
              {error}
            </p>
          )}
          {info && (
            <p className="mt-6 font-body text-[13px] text-foreground text-center">
              {info}
            </p>
          )}

          {/* Toggle between sign in / sign up */}
          <p className="mt-10 font-body text-[13px] text-muted text-center">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-foreground hover:underline underline-offset-4"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                  className="text-foreground hover:underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-12 font-body text-[12px] text-muted text-center">
            By continuing, you agree to our terms of service.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
