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
};

export default nextConfig;
