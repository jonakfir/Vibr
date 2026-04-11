"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IdeaCard } from "@/components/ui/idea-card";
import { GhostButton } from "@/components/ui/ghost-button";
import { useStore, type Idea } from "@/lib/store";
import { FormInput } from "@/components/ui/form-input";

interface NameSuggestion {
  name: string;
  domain_available: boolean;
}

export default function IdeasPage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const ideas = useStore((s) => s.ideas);
  const setIdeas = useStore((s) => s.setIdeas);
  const selectedIdea = useStore((s) => s.selectedIdea);
  const setSelectedIdea = useStore((s) => s.setSelectedIdea);
  const productName = useStore((s) => s.productName);
  const setProductName = useStore((s) => s.setProductName);
  const flowMode = useStore((s) => s.flowMode);
  const setFlowMode = useStore((s) => s.setFlowMode);
  const projectDescription = useStore((s) => s.projectDescription);
  const setProjectDescription = useStore((s) => s.setProjectDescription);

  const [modeChosen, setModeChosen] = useState(flowMode !== "generate" ? true : false);
  const [loading, setLoading] = useState(false);
  const [ideaError, setIdeaError] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [customName, setCustomName] = useState("");
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [customDomainAvailable, setCustomDomainAvailable] = useState<
    boolean | null
  >(null);

  const fetchIdeas = useCallback(async () => {
    if (ideas.length > 0) return;
    setLoading(true);
    setIdeaError(null);

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: profile.skills,
          interests: profile.interests,
          experience_level: profile.experience_level,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setIdeaError(
          (data && typeof data.error === "string" && data.error) ||
            `Couldn't generate ideas (HTTP ${res.status}).`
        );
        setIdeas([]);
        return;
      }

      const fetched = Array.isArray(data.ideas) ? data.ideas : [];
      setIdeas(fetched);
      if (fetched.length === 0) {
        setIdeaError("No ideas came back from the generator. Try again.");
      }
    } catch (err) {
      setIdeaError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the idea generator."
      );
    } finally {
      setLoading(false);
    }
  }, [ideas.length, profile, setIdeas]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  async function handleGenerateNames() {
    if (!selectedIdea) return;
    setLoadingNames(true);
    setNameSuggestions([]);

    try {
      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: selectedIdea }),
      });

      if (res.ok) {
        const data = await res.json();
        setNameSuggestions(data.names ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingNames(false);
    }
  }

  async function handleCheckDomain() {
    if (!customName.trim()) return;
    setCheckingDomain(true);
    setCustomDomainAvailable(null);

    try {
      const res = await fetch(
        `/api/check-domain?name=${encodeURIComponent(customName.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setCustomDomainAvailable(data.available ?? false);
      }
    } catch {
      setCustomDomainAvailable(null);
    } finally {
      setCheckingDomain(false);
    }
  }

  function handleSelectName(name: string) {
    setProductName(name);
    setCustomName("");
    setCustomDomainAvailable(null);
  }

  function handleContinue() {
    if (!selectedIdea || !productName) return;
    router.push("/onboarding/build");
  }

  const canContinue = selectedIdea !== null && productName.length > 0;

  /* ── mode chooser ── */

  if (!modeChosen) {
    return (
      <div className="max-w-[800px] mx-auto py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="font-heading font-light text-title text-foreground mb-4">
            How do you want to start?
          </h1>
          <p className="font-body font-light text-body text-muted mb-12">
            Generate a new idea from scratch, or bring a project you&rsquo;re already working on.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => {
              setFlowMode("generate");
              setModeChosen(true);
            }}
            className="text-left bg-card border border-card-border rounded-[4px] p-8 hover:border-foreground transition-colors duration-300 group"
          >
            <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-4">
              New Idea
            </p>
            <h2 className="font-heading font-light text-subtitle text-foreground mb-3">
              Start fresh
            </h2>
            <p className="font-body text-small text-muted">
              AI generates business ideas tailored to your skills and interests. Pick one, name it, and start building.
            </p>
            <p className="font-body text-small text-foreground mt-6 group-hover:text-accent transition-colors duration-300">
              Generate ideas →
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setFlowMode("import");
              setModeChosen(true);
            }}
            className="text-left bg-card border border-card-border rounded-[4px] p-8 hover:border-foreground transition-colors duration-300 group"
          >
            <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-4">
              Existing Project
            </p>
            <h2 className="font-heading font-light text-subtitle text-foreground mb-3">
              Work on something you have
            </h2>
            <p className="font-body text-small text-muted">
              Bring your existing code, connect to your files, and use the AI IDE to edit, improve, or add features.
            </p>
            <p className="font-body text-small text-foreground mt-6 group-hover:text-accent transition-colors duration-300">
              Import project →
            </p>
          </button>
        </div>
      </div>
    );
  }

  /* ── import mode ── */

  if (flowMode === "import") {
    const canContinueImport = productName.trim().length > 0;

    return (
      <div className="max-w-[640px] mx-auto py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <button
            type="button"
            onClick={() => setModeChosen(false)}
            className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300 mb-8"
          >
            ← Back
          </button>

          <h1 className="font-heading font-light text-title text-foreground mb-4">
            Tell us about your project.
          </h1>
          <p className="font-body font-light text-body text-muted mb-12">
            We&rsquo;ll set up the IDE so you can start editing right away.
          </p>

          <div className="space-y-8">
            <div>
              <label className="font-body text-[10px] uppercase tracking-wide text-muted block mb-2">
                Project name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="My SaaS App"
                className="w-full bg-transparent font-body text-body text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300"
              />
            </div>

            <div>
              <label className="font-body text-[10px] uppercase tracking-wide text-muted block mb-2">
                Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What does it do? What are you working on? What do you want to add or change?"
                rows={4}
                className="w-full bg-transparent font-body text-body text-foreground border-0 border-b border-border focus:border-foreground outline-none py-2 transition-colors duration-300 resize-none"
              />
            </div>
          </div>

          <div className="pt-10">
            <GhostButton
              onClick={() => router.push("/onboarding/build")}
              className={!canContinueImport ? "opacity-30 pointer-events-none" : ""}
            >
              Continue to build
            </GhostButton>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── generate mode (original flow) ── */

  if (loading) {
    return (
      <div className="max-w-[640px] mx-auto py-16 flex items-center justify-center min-h-[60vh]">
        <motion.p
          className="font-heading font-light text-subtitle text-foreground"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Generating ideas...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={() => setModeChosen(false)}
          className="font-body text-xs text-muted hover:text-foreground transition-colors duration-300 mb-8"
        >
          ← Back
        </button>

        <h1 className="font-heading font-light text-title text-foreground mb-16">
          Here&rsquo;s what you could build.
        </h1>
      </motion.div>

      {ideaError && (
        <div className="mb-10 border border-red-500/40 px-4 py-3 font-body text-[13px] text-red-300 flex items-center justify-between gap-4">
          <span>{ideaError}</span>
          <button
            type="button"
            onClick={() => {
              setIdeas([]);
              fetchIdeas();
            }}
            className="font-body text-[11px] uppercase tracking-[0.15em] text-red-200 hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !ideaError && ideas.length === 0 && (
        <div className="mb-10 border border-border px-4 py-6 text-center font-body text-[13px] text-muted">
          No ideas yet.{" "}
          <button
            type="button"
            onClick={fetchIdeas}
            className="text-foreground hover:underline"
          >
            Generate now
          </button>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        {ideas.map((idea, i) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * i }}
          >
            <IdeaCard
              sector={idea.sector}
              name={idea.name}
              description={idea.description}
              metadata={idea.metadata}
              selected={selectedIdea?.id === idea.id}
              onSelect={() =>
                setSelectedIdea(
                  selectedIdea?.id === idea.id ? null : idea
                )
              }
            />
          </motion.div>
        ))}
      </motion.div>

      {selectedIdea && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[640px]"
        >
          <h2 className="font-heading font-light text-subtitle text-foreground mb-8">
            Name your product.
          </h2>

          {nameSuggestions.length === 0 && !loadingNames && (
            <button
              type="button"
              onClick={handleGenerateNames}
              className="font-body text-small text-foreground hover:text-accent transition-colors duration-300 mb-8 group"
            >
              Generate name suggestions{" "}
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </button>
          )}

          {loadingNames && (
            <motion.p
              className="font-body text-small text-muted mb-8"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Generating names...
            </motion.p>
          )}

          {nameSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-10">
              {nameSuggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => handleSelectName(suggestion.name)}
                  className={`inline-flex items-center gap-2 border px-4 py-2 font-body text-small transition-colors duration-300 rounded-[4px] ${
                    productName === suggestion.name
                      ? "border-accent text-foreground"
                      : "border-border text-muted hover:text-foreground hover:border-foreground"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      suggestion.domain_available
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  {suggestion.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-4 mb-10">
            <div className="flex-1 relative">
              <motion.label
                className="absolute left-0 font-body text-muted pointer-events-none origin-left"
                style={{
                  fontSize:
                    customName.length > 0 || productName ? "11px" : "16px",
                  textTransform:
                    customName.length > 0 || productName
                      ? "uppercase"
                      : "none",
                  letterSpacing:
                    customName.length > 0 || productName ? "0.2em" : "0.02em",
                }}
                initial={false}
                animate={{
                  y: customName.length > 0 || productName ? 0 : 24,
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                Or type a name
              </motion.label>
              <input
                type="text"
                value={customName || productName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setProductName(e.target.value);
                  setCustomDomainAvailable(null);
                }}
                className="w-full bg-transparent font-body text-body text-foreground border-0 border-b border-border focus:border-foreground outline-none transition-colors duration-300 pt-6 pb-2 px-0"
              />
            </div>
            <button
              type="button"
              onClick={handleCheckDomain}
              disabled={checkingDomain || !customName.trim()}
              className="font-body text-xs uppercase tracking-wide text-muted hover:text-foreground transition-colors duration-300 pb-2 whitespace-nowrap disabled:opacity-30"
            >
              {checkingDomain ? "Checking..." : "Check domain"}
            </button>
            {customDomainAvailable !== null && (
              <span
                className={`pb-2 w-2 h-2 rounded-full flex-shrink-0 ${
                  customDomainAvailable ? "bg-green-500" : "bg-red-500"
                }`}
              />
            )}
          </div>

          <div className="pt-4">
            <GhostButton
              onClick={handleContinue}
              className={
                !canContinue ? "opacity-30 pointer-events-none" : ""
              }
            >
              Continue
            </GhostButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
