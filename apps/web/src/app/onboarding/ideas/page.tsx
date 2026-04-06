"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IdeaCard } from "@/components/ui/idea-card";
import { GhostButton } from "@/components/ui/ghost-button";
import { useStore, type Idea } from "@/lib/store";

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

  const [loading, setLoading] = useState(false);
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

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (res.ok) {
        const data = await res.json();
        setIdeas(data.ideas ?? []);
      }
    } catch {
      // Silent fail
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
        <h1 className="font-heading font-light text-title text-foreground mb-16">
          Here&rsquo;s what you could build.
        </h1>
      </motion.div>

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
