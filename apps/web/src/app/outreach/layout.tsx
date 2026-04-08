import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Cold Email Generator for Startup Outreach",
  description:
    "Generate personalized cold emails that reference real context from your prospect's work. Vibr's AI outreach tool writes emails that sound human, not templated, so you actually get replies.",
  alternates: {
    canonical: "https://vibr-ai.com/outreach",
  },
  openGraph: {
    title: "AI Cold Email Generator for Startup Outreach",
    description:
      "Generate personalized cold emails that reference real context from your prospect's work. Vibr's AI outreach tool writes emails that sound human, not templated.",
    type: "website",
  },
};

export default function OutreachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
