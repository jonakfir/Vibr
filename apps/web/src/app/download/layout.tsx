import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download vibr-local",
  description:
    "Download vibr-local, the CLI that connects your local filesystem to Vibr's browser IDE. Install via npm or download the binary for macOS, Linux, or Windows.",
  alternates: {
    canonical: "https://vibr-ai.com/download",
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
