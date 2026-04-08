import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Vibr Pro — $49/mo. Unlimited AI idea generation, BYOK coding IDE, marketer matching, cold email outreach, one-click deploy, and full vibr-local access.",
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
