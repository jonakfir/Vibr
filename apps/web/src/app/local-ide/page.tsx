import type { Metadata } from "next";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";
import { GhostButton } from "@/components/ui/ghost-button";

export const metadata: Metadata = {
  title: "Local AI Coding Tool with BYOK — vibr-local | Vibr",
  description:
    "vibr-local is a local AI coding tool that connects your browser IDE to local files. Bring your own API key for Claude, OpenAI, or Gemini. Terminal, file browser, git ops — all in the browser.",
  openGraph: {
    title: "Local AI Coding Tool with BYOK — vibr-local | Vibr",
    description:
      "vibr-local connects your browser IDE to local files. BYOK for Claude, OpenAI, or Gemini. Terminal, file browser, git ops — a Claude Code alternative in the browser.",
    type: "website",
  },
};

export default function LocalIdePage() {
  return (
    <main className="bg-background min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="font-heading font-light text-5xl md:text-7xl text-foreground leading-tight">
            Local AI Coding Tool
            <br />
            with BYOK
          </h1>
          <p className="mt-8 font-body font-light text-lg text-muted max-w-[600px] mx-auto">
            vibr-local is a lightweight CLI that bridges your local filesystem
            to a full browser-based IDE. Bring your own API key. Keep your code
            on your machine.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">
              Try vibr-local
            </GhostButton>
          </div>
        </div>
      </section>

      {/* What is vibr-local */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            A BYOK AI Coding IDE Connected to Your Local Files
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            vibr-local runs a small local server that exposes your project
            directory to the Vibr browser IDE over a secure tunnel. You get a
            full code editor, integrated terminal, file browser, and git
            operations — all rendered in the browser but reading and writing
            directly to your disk.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Bring your own key (BYOK) for Claude, OpenAI, or Gemini. Your API
            key stays in your browser and is never stored on our servers. You
            choose the model, you control the cost.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Terminal, File Browser, and Git Ops in the Browser
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            The IDE ships with a real terminal emulator connected to your local
            shell, so you can run build commands, install packages, and execute
            scripts without switching windows. The file tree mirrors your
            project directory in real time — create, rename, move, or delete
            files and see changes reflected instantly.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Built-in git integration lets you stage, commit, diff, and push
            without leaving the editor. Combined with AI-assisted code
            generation, you get a complete vibe coding workflow from a single
            browser tab.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Claude Code Alternative That Runs in Your Browser
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted leading-relaxed">
            If you like Claude Code but want a visual interface, vibr-local
            fills that gap. It gives you the same direct-to-filesystem AI coding
            experience with a proper editor, syntax highlighting, multi-file
            tabs, and a preview pane — all without leaving the browser.
          </p>
          <p className="mt-4 font-body font-light text-base text-muted leading-relaxed">
            Because everything is local-first, your code never touches our
            servers. The AI calls go straight from your browser to the provider
            using your key. It is the privacy-friendly way to use AI for
            development.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-[#222]">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-heading font-light text-3xl md:text-4xl text-foreground">
            Start Coding Locally with AI
          </h2>
          <p className="mt-6 font-body font-light text-base text-muted max-w-[520px] mx-auto">
            Install the CLI, plug in your API key, and open your project in the
            browser. It takes about two minutes.
          </p>
          <div className="mt-8">
            <GhostButton href="/onboarding">Get started</GhostButton>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
