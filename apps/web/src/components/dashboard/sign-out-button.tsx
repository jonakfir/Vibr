"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handle = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
    >
      Sign out
    </button>
  );
}
