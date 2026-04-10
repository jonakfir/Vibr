"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="w-full max-w-[440px] text-center">
          <h1 className="font-heading font-light text-[56px] md:text-[72px] leading-[0.95] text-foreground">
            Sign in
          </h1>
          <p className="mt-6 font-body text-muted text-[15px]">
            Continue with Google to start building.
          </p>

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

          {error && (
            <p className="mt-6 font-body text-[13px] text-red-400">{error}</p>
          )}

          <p className="mt-12 font-body text-[12px] text-muted">
            By continuing, you agree to our terms of service.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
