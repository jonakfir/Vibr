"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plug,
  Wallet,
  Users,
  UserCog,
  FileText,
  Settings,
} from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/team", label: "Team", icon: UserCog },
  { href: "/dashboard/content", label: "Content", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border min-h-[calc(100vh-4rem)] pt-8 px-4 hidden lg:block">
      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-[4px] font-body text-sm transition-colors duration-200 ${
                active
                  ? "bg-card text-foreground border border-border"
                  : "text-muted hover:text-foreground hover:bg-card/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
