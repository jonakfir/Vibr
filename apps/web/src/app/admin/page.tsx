import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import AdminConsole from "./admin-console";

/**
 * Admin-only dashboard.
 *
 * Server component that gates access on the hardcoded admin list in
 * lib/auth.ts. Actual interactive UI (user list, create/delete forms,
 * bootstrap button) lives in the AdminConsole client component so it can
 * call the /api/admin/* endpoints.
 */

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?next=/admin");
  }
  if (!isAdmin(user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Nav />
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-6 pt-32 pb-24">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
              Admin console
            </p>
            <h1 className="font-heading font-light text-5xl md:text-6xl text-foreground mt-2">
              Users & access.
            </h1>
          </div>
          <p className="font-body text-[13px] text-muted">
            Signed in as <span className="text-foreground">{user.email}</span>
          </p>
        </div>

        <AdminConsole currentUserEmail={user.email ?? ""} />
      </main>
      <Footer />
    </div>
  );
}
