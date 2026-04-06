import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibr — Build it. Ship it. Find someone to sell it.",
  description:
    "Vibr turns your skills into a product, a Claude Code prompt, and a marketer who will grow it.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vibr — Build it. Ship it. Find someone to sell it.",
    description:
      "Vibr turns your skills into a product, a Claude Code prompt, and a marketer who will grow it.",
    type: "website",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
