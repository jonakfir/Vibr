/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  // Send common alternative auth URLs to the canonical /auth page.
  // Uses 308 (permanent) so search engines and browsers cache it.
  async redirects() {
    return [
      { source: "/signup", destination: "/auth", permanent: true },
      { source: "/sign-up", destination: "/auth", permanent: true },
      { source: "/login", destination: "/auth", permanent: true },
      { source: "/log-in", destination: "/auth", permanent: true },
      { source: "/sign-in", destination: "/auth", permanent: true },
      { source: "/signin", destination: "/auth", permanent: true },
    ];
  },
  // Cross-origin isolation headers scoped to the IDE page only.
  //
  // WebContainers (the in-browser Node sandbox used by the build page
  // live preview) require a cross-origin-isolated context, which means
  // the document must be served with COOP "same-origin" and COEP
  // "credentialless" (or "require-corp"). We use "credentialless"
  // because it doesn't force every subresource to carry CORP headers,
  // so Tailwind / Next internals / third-party fonts keep working.
  //
  // These headers are INTENTIONALLY scoped to /onboarding/build only.
  // Applying them site-wide would break Google OAuth popups, embedded
  // Stripe iframes, and any other cross-origin integration we add
  // later. The rest of the app is unaffected.
  async headers() {
    return [
      {
        source: "/onboarding/build",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/onboarding/build/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
