import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local AI Coding Tool with BYOK — vibr-local",
  description:
    "vibr-local is a local AI coding tool that connects your browser IDE to local files. Bring your own API key for Claude, OpenAI, or Gemini. Terminal, file browser, git ops — all in the browser.",
  alternates: {
    canonical: "https://vibr-ai.com/local-ide",
  },
  openGraph: {
    title: "Local AI Coding Tool with BYOK — vibr-local",
    description:
      "vibr-local connects your browser IDE to local files. BYOK for Claude, OpenAI, or Gemini. Terminal, file browser, git ops — a Claude Code alternative in the browser.",
    type: "website",
  },
};

export default function LocalIdeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
