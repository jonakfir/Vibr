import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Vibr pricing plans. Start free with 3 idea generations per month, or upgrade to Pro for $49/mo with unlimited ideas, AI coding, marketer matching, and cold email outreach.",
  alternates: {
    canonical: "https://vibr-ai.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
