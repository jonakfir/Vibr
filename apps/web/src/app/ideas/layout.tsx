import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Startup Idea Generator Based on Your Skills",
  description:
    "Generate personalized AI business ideas based on your skills, interests, and experience. Vibr's AI startup idea generator delivers tailored SaaS concepts with market analysis so you can start building today.",
  alternates: {
    canonical: "https://vibr-ai.com/ideas",
  },
  openGraph: {
    title: "AI Startup Idea Generator Based on Your Skills",
    description:
      "Generate personalized AI business ideas based on your skills, interests, and experience. Vibr's AI startup idea generator delivers tailored SaaS concepts with market analysis.",
    type: "website",
  },
};

export default function IdeasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
