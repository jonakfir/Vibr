import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vibr-ai.com"),
  title: {
    template: "%s | Vibr",
    default: "Vibr — Build it. Ship it. Find someone to sell it.",
  },
  description:
    "Vibr turns your skills into a product, a prompt, and finds a marketer who will grow it. AI-powered startup idea generator, local coding IDE with BYOK, and marketer matching.",
  keywords: [
    "AI startup idea generator",
    "vibe coding tool",
    "AI business ideas",
    "BYOK AI coding",
    "find marketers for SaaS",
    "AI cold email generator",
    "local AI coding tool",
    "vibr-local",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibr — Build it. Ship it. Find someone to sell it.",
    description:
      "Vibr turns your skills into a product, a prompt, and finds a marketer who will grow it. AI-powered startup idea generator, local coding IDE with BYOK, and marketer matching.",
    url: "https://vibr-ai.com",
    siteName: "Vibr",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibr — Build it. Ship it. Find someone to sell it.",
    description:
      "Vibr turns your skills into a product, a prompt, and finds a marketer who will grow it. AI-powered startup idea generator, local coding IDE with BYOK, and marketer matching.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://vibr-ai.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Vibr",
                "url": "https://vibr-ai.com",
                "logo": "https://vibr-ai.com/logo.svg",
                "description": "AI-powered platform that generates startup ideas, provides a local coding IDE with BYOK, and matches you with marketers to grow your product.",
                "sameAs": []
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Vibr",
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "Web, macOS, Linux, Windows",
                "offers": {
                  "@type": "Offer",
                  "price": "49",
                  "priceCurrency": "USD",
                  "priceValidUntil": "2027-12-31"
                },
                "description": "AI startup idea generator, BYOK coding IDE connected to local files, and marketer matching platform for solo builders."
              }
            ])
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
