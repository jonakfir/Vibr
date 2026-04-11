"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FormInput } from "@/components/ui/form-input";
import { GhostButton } from "@/components/ui/ghost-button";
import { useStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

function TagInput({
  label,
  tags,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const isFloating = focused || tags.length > 0 || input.length > 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onRemove(tags.length - 1);
    }
  }

  return (
    <div className="relative w-full">
      <motion.label
        className="absolute left-0 font-body text-muted pointer-events-none origin-left"
        style={{
          fontSize: isFloating ? "11px" : "16px",
          textTransform: isFloating ? "uppercase" : "none",
          letterSpacing: isFloating ? "0.2em" : "0.02em",
        }}
        initial={false}
        animate={{ y: isFloating ? 0 : 24 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {label}
      </motion.label>

      <div className="pt-6 pb-2 border-0 border-b border-border focus-within:border-foreground transition-colors duration-300">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 border border-border bg-transparent px-2.5 py-1 text-xs uppercase tracking-wide text-foreground font-body"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted hover:text-foreground transition-colors ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="bg-transparent outline-none text-foreground font-body text-body flex-1 min-w-[120px]"
          />
        </div>
      </div>
    </div>
  );
}

function ResumeDropZone({
  onUpload,
  uploading,
  fileName,
}: {
  onUpload: (file: File) => void;
  uploading: boolean;
  fileName: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  return (
    <div className="relative w-full">
      <p className="font-body text-[11px] uppercase tracking-wide text-muted mb-3">
        Resume
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border border-dashed rounded-[4px] p-8 flex items-center justify-center cursor-pointer transition-colors duration-300 ${
          dragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
        {uploading ? (
          <p className="font-body text-small text-muted animate-pulse">
            Parsing resume...
          </p>
        ) : fileName ? (
          <p className="font-body text-small text-foreground">{fileName}</p>
        ) : (
          <p className="font-body text-small text-muted">
            Drop your resume or click to browse
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setSessionId = useStore((s) => s.setSessionId);
  const setIdeas = useStore((s) => s.setIdeas);
  const setSelectedIdea = useStore((s) => s.setSelectedIdea);
  const setPrompt = useStore((s) => s.setPrompt);
  const setProductName = useStore((s) => s.setProductName);

  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // On mount, pre-populate the form with whatever we already know about the
  // user: (a) any existing row in the `profiles` table, (b) fallback to their
  // Google OAuth metadata (full_name from user_metadata.name or .full_name),
  // (c) finally the raw email. This means a user who just signed in with
  // Google doesn't land on a completely empty profile form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Google metadata lives on user_metadata and comes from the OAuth
        // provider. `full_name` and `name` are both common shapes.
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const metaName =
          (typeof meta.full_name === "string" && meta.full_name) ||
          (typeof meta.name === "string" && meta.name) ||
          "";
        const metaAvatar =
          (typeof meta.avatar_url === "string" && meta.avatar_url) || "";

        // Load the existing row from the profiles table if it exists — this
        // is what we want to actually show as source of truth if the user
        // has already filled anything in before.
        const { data: existing } = (await supabase
          .from("profiles")
          .select("full_name, skills, experience_level, interests, linkedin_url, resume_url")
          .eq("id", user.id)
          .maybeSingle()) as {
          data: {
            full_name: string | null;
            skills: string[] | null;
            experience_level: string | null;
            interests: string[] | null;
            linkedin_url: string | null;
            resume_url: string | null;
          } | null;
        };

        if (cancelled) return;

        const merged = {
          full_name: existing?.full_name || metaName || "",
          skills: existing?.skills ?? [],
          experience_level: existing?.experience_level || "",
          interests: existing?.interests ?? [],
          linkedin_url: existing?.linkedin_url || "",
          resume_url: existing?.resume_url || metaAvatar || "",
        };

        // Only overwrite store fields that are still empty — we don't want to
        // wipe out anything the user just typed before this effect finishes.
        setProfile({
          ...(profile.full_name ? {} : { full_name: merged.full_name }),
          ...(profile.skills.length ? {} : { skills: merged.skills }),
          ...(profile.experience_level
            ? {}
            : { experience_level: merged.experience_level }),
          ...(profile.interests.length ? {} : { interests: merged.interests }),
          ...(profile.linkedin_url
            ? {}
            : { linkedin_url: merged.linkedin_url }),
          ...(profile.resume_url ? {} : { resume_url: merged.resume_url }),
        });

        // Also make sure a row actually exists in the profiles table — the
        // signup trigger should have done this automatically, but if it's
        // missing for any reason (older account, trigger disabled, etc.)
        // create it now so later UPDATEs don't fail.
        if (!existing) {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              full_name: metaName || null,
            },
            { onConflict: "id" }
          );
        }
      } catch {
        // Non-fatal — user can still fill the form manually.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setResumeFile(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile({
          full_name: data.full_name || profile.full_name,
          skills: data.skills?.length ? data.skills : profile.skills,
          interests: data.interests?.length ? data.interests : profile.interests,
          resume_url: data.resume_url || profile.resume_url,
        });
      }
    } catch {
      // Silently fail - user can fill manually
    } finally {
      setUploading(false);
    }
  }

  async function handleContinue() {
    if (!profile.full_name.trim()) return;
    setSubmitting(true);

    // Profile changed → every downstream thing (previously-generated
    // ideas, the selected idea, the generated build prompt, the
    // chosen product name) is stale and must be cleared. Otherwise
    // the user updates their profile, clicks through to /ideas, and
    // sees cached results from the old profile.
    setIdeas([]);
    setSelectedIdea(null);
    setPrompt("");
    setProductName("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Persist the profile to the profiles table so it's the user's
        // canonical record (not just a snapshot inside a session).
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: profile.full_name,
            skills: profile.skills,
            experience_level: profile.experience_level,
            interests: profile.interests,
            linkedin_url: profile.linkedin_url || null,
            resume_url: profile.resume_url || null,
          },
          { onConflict: "id" }
        );

        // Also create/update a session row so the rest of the onboarding
        // flow has somewhere to attach ideas / prompts / marketers.
        const { data } = await supabase
          .from("sessions")
          .upsert({
            user_id: user.id,
            profile_data: profile,
            step: 1,
          })
          .select("id")
          .single();

        if (data?.id) {
          setSessionId(data.id);
        }
      }
    } catch {
      // Continue even if save fails
    }

    setSubmitting(false);
    router.push("/onboarding/ideas");
  }

  return (
    <div className="max-w-[640px] mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <h1 className="font-heading font-light text-title text-foreground mb-3">
          Tell us about yourself.
        </h1>
        <p className="font-body text-body text-muted mb-16">
          The more we know, the better your ideas.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <FormInput
          label="Full name"
          name="full_name"
          value={profile.full_name}
          onChange={(e) => setProfile({ full_name: e.target.value })}
          required
        />

        <TagInput
          label="Skills"
          tags={profile.skills}
          onAdd={(tag) =>
            setProfile({ skills: [...profile.skills, tag] })
          }
          onRemove={(i) =>
            setProfile({
              skills: profile.skills.filter((_, idx) => idx !== i),
            })
          }
        />

        <FormInput
          label="Experience level"
          name="experience_level"
          value={profile.experience_level}
          onChange={(e) => setProfile({ experience_level: e.target.value })}
          as="select"
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
            { value: "expert", label: "Expert" },
          ]}
        />

        <TagInput
          label="Interests"
          tags={profile.interests}
          onAdd={(tag) =>
            setProfile({ interests: [...profile.interests, tag] })
          }
          onRemove={(i) =>
            setProfile({
              interests: profile.interests.filter((_, idx) => idx !== i),
            })
          }
        />

        <FormInput
          label="LinkedIn URL"
          name="linkedin_url"
          value={profile.linkedin_url}
          onChange={(e) => setProfile({ linkedin_url: e.target.value })}
          placeholder="https://linkedin.com/in/..."
        />

        <ResumeDropZone
          onUpload={handleResumeUpload}
          uploading={uploading}
          fileName={resumeFile}
        />

        <div className="pt-8">
          <GhostButton
            onClick={handleContinue}
            className={submitting ? "opacity-50 pointer-events-none" : ""}
          >
            {submitting ? "Saving..." : "Continue"}
          </GhostButton>
        </div>
      </motion.div>
    </div>
  );
}
