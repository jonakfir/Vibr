"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

const DOWNLOAD_LINKS = [
  { label: "macOS (Apple Silicon)", href: "#" },
  { label: "macOS (Intel)", href: "#" },
  { label: "Linux", href: "#" },
  { label: "Windows", href: "#" },
];

const COMMANDS = [
  { command: "vibr-local start", description: "Start the local server and connect to Vibr" },
  { command: "vibr-local stop", description: "Stop the running server" },
  { command: "vibr-local status", description: "Check if the server is running" },
  { command: "vibr-local version", description: "Print the installed version" },
];

export default function DownloadPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npm install -g vibr-local");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-background pt-32 pb-32">
        <div className="max-w-[720px] mx-auto px-6">
          {/* Hero */}
          <motion.h1
            className="font-heading font-light text-display text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            vibr-local
          </motion.h1>
          <motion.p
            className="mt-4 font-body text-body-lg text-muted leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A local server that gives Vibr access to your files, git, and
            terminal.
          </motion.p>

          {/* Install */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="font-body text-xs uppercase tracking-wide text-muted mb-4">
              Install via npm
            </p>
            <div className="relative bg-card border border-card-border p-6">
              <code className="font-mono text-body text-foreground">
                npm install -g vibr-local
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-4 right-4 font-body text-xs text-muted hover:text-foreground transition-colors duration-300"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </motion.section>

          {/* Getting Started */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
              Getting started
            </h2>
            <div className="font-body text-body text-muted leading-relaxed space-y-4">
              <p>
                Install vibr-local globally with{" "}
                <code className="font-mono text-foreground bg-card px-1.5 py-0.5">
                  npm install -g vibr-local
                </code>
                .
              </p>
              <p>
                Run{" "}
                <code className="font-mono text-foreground bg-card px-1.5 py-0.5">
                  vibr-local start
                </code>{" "}
                from your project directory.
              </p>
              <p>
                Copy the auth token printed in the terminal.
              </p>
              <p>
                Paste the token in Vibr&apos;s coding interface to connect.
              </p>
            </div>
          </motion.section>

          {/* Direct Download */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <p className="font-body text-xs uppercase tracking-wide text-muted mb-6">
              Or download the binary
            </p>
            <div className="space-y-3">
              {DOWNLOAD_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block font-body text-body text-foreground hover:underline transition-colors duration-300"
                >
                  {link.label} &rarr;
                </a>
              ))}
            </div>
          </motion.section>

          {/* Commands Reference */}
          <motion.section
            className="mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
              Commands
            </h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                    Command
                  </th>
                  <th className="text-left font-body text-xs uppercase tracking-wide text-muted pb-3 font-normal">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMMANDS.map((cmd) => (
                  <tr key={cmd.command} className="border-b border-border">
                    <td className="py-4">
                      <code className="font-mono text-small text-foreground">
                        {cmd.command}
                      </code>
                    </td>
                    <td className="py-4 font-body text-small text-muted">
                      {cmd.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  );
}
