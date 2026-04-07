"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GhostButton } from "@/components/ui/ghost-button";
import { useStore } from "@/lib/store";

export default function DeployPage() {
  const router = useRouter();
  const productName = useStore((s) => s.productName);
  const prompt = useStore((s) => s.prompt);

  const [vercelToken, setVercelToken] = useState("");
  const [projectName, setProjectName] = useState(productName.toLowerCase().replace(/\s+/g, "-"));
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"vercel" | "manual">("vercel");

  async function handleDeploy() {
    if (!vercelToken || !projectName) return;
    setDeploying(true);
    setError(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vercelToken, projectName }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDeployUrl(data.url || data.deployUrl);
      }
    } catch {
      setError("Deployment failed. Please try again.");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="max-w-[640px] mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="font-heading font-light text-title text-foreground mb-3">
          Ship it.
        </h1>
        <p className="font-body text-body text-muted mb-12">
          Deploy your product to the world.
        </p>
      </motion.div>

      {/* tab switcher */}
      <div className="flex gap-6 mb-10 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("vercel")}
          className={`font-body text-xs uppercase tracking-wide pb-3 transition-colors duration-300 ${
            tab === "vercel" ? "text-foreground border-b border-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Deploy to Vercel
        </button>
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`font-body text-xs uppercase tracking-wide pb-3 transition-colors duration-300 ${
            tab === "manual" ? "text-foreground border-b border-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Deploy manually
        </button>
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tab === "vercel" ? (
          <div className="space-y-8">
            <div>
              <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
                Vercel Personal Access Token
              </p>
              <input
                type="password"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Get one at vercel.com/account/tokens"
                className="w-full bg-transparent font-mono text-xs text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
              />
              <p className="font-body text-xs text-muted mt-2">
                Create a token at{" "}
                <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-accent transition-colors">
                  vercel.com/account/tokens
                </a>
              </p>
            </div>

            <div>
              <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-2">
                Project Name
              </p>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full bg-transparent font-mono text-xs text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
              />
            </div>

            {error && (
              <p className="font-body text-small text-red-400">{error}</p>
            )}

            {deployUrl ? (
              <div className="space-y-4">
                <p className="font-body text-body text-foreground">
                  Deployed successfully.
                </p>
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-small text-accent hover:text-foreground transition-colors"
                >
                  {deployUrl} &rarr;
                </a>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleDeploy}
                disabled={deploying || !vercelToken || !projectName}
                className="font-body text-small text-foreground border-b border-foreground pb-0.5 hover:text-accent hover:border-accent transition-colors duration-300 disabled:opacity-30 group"
              >
                {deploying ? "Deploying..." : "Deploy"}{" "}
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-6">
              <div>
                <p className="font-heading font-light text-[22px] text-foreground mb-3">1. Push to GitHub</p>
                <div className="bg-card border border-card-border rounded-[4px] p-4 font-mono text-xs text-muted leading-relaxed">
                  <p>git init</p>
                  <p>git add -A</p>
                  <p>git commit -m &quot;Initial commit&quot;</p>
                  <p>git remote add origin https://github.com/you/your-repo.git</p>
                  <p>git push -u origin main</p>
                </div>
              </div>

              <div>
                <p className="font-heading font-light text-[22px] text-foreground mb-3">2. Import to Vercel</p>
                <p className="font-body text-small text-muted">
                  Go to{" "}
                  <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-accent transition-colors">
                    vercel.com/new
                  </a>
                  , import your GitHub repository, and click Deploy.
                </p>
              </div>

              <div>
                <p className="font-heading font-light text-[22px] text-foreground mb-3">3. Set environment variables</p>
                <p className="font-body text-small text-muted">
                  Add your API keys and database credentials in the Vercel project settings under Environment Variables.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="pt-16">
        <GhostButton href="/onboarding/launch">
          Continue to launch
        </GhostButton>
      </div>
    </div>
  );
}
