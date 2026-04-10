import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require an authenticated Supabase session.
// `/onboarding/*` — new-user profile flow (empty state is useless w/o a user)
// `/dashboard/*`  — post-auth landing
// `/find-marketers/*`, `/outreach/*` — any product pages behind auth
const PROTECTED_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/find-marketers",
  "/outreach",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function middleware(request: NextRequest) {
  // Always refresh the session cookie via the Supabase helper so downstream
  // server components see a current user. `response` already carries the
  // refreshed cookies.
  const { supabase, response } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  if (!isProtected(pathname)) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    // Preserve where the user was headed so /auth/callback can return them.
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return response;
}

// Only run the middleware on request paths we care about, to avoid the
// per-request cost on static assets. The negative lookahead skips Next's
// internals and the public/ static file extensions.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|hero-frames|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
