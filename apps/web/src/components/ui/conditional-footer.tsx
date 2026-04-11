"use client";

/**
 * Renders the global Footer everywhere EXCEPT routes where it would
 * collide with a full-screen UI (currently just the build page, which
 * is the in-browser IDE and needs all available vertical space).
 *
 * Lives as a separate client component so the root layout can stay a
 * server component.
 */

import { usePathname } from "next/navigation";
import Footer from "./footer";

const HIDE_ON_PATHS = ["/onboarding/build"];

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (HIDE_ON_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "/"))) {
    return null;
  }
  return <Footer />;
}
