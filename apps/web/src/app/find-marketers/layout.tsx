import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Tool to Find Marketers for Your Product",
  description:
    "Use Vibr's AI to find marketers, influencers, and journalists on LinkedIn who are the best match for your product. Get ranked results with match scores so you reach the right people first.",
  alternates: {
    canonical: "https://vibr-ai.com/find-marketers",
  },
  openGraph: {
    title: "AI Tool to Find Marketers for Your Product",
    description:
      "Use Vibr's AI to find marketers, influencers, and journalists on LinkedIn who are the best match for your product. Get ranked results with match scores.",
    type: "website",
  },
};

export default function FindMarketersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
