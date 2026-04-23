import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { getActiveCompany, listUserCompanies } from "@/lib/dashboard/company";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, all] = await Promise.all([
    getActiveCompany(),
    listUserCompanies(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border flex items-center px-6 gap-6">
        <Link
          href="/"
          className="font-heading font-light text-[20px] text-foreground"
        >
          Vibr
        </Link>
        <div className="h-5 w-px bg-border" />
        <WorkspaceSwitcher active={active} all={all} />
        <div className="flex-1" />
        <nav className="flex items-center gap-6">
          <Link
            href="/onboarding"
            className="font-body text-nav uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300"
          >
            New session
          </Link>
          <SignOutButton />
        </nav>
      </header>
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
