"use client";

/**
 * Signed-in user's profile page. Shows who you are, lets you edit your
 * name / skills / experience / interests / linkedin, and surfaces an
 * admin-only shortcut if your email is in the hardcoded admin list.
 *
 * Hardcoded values: the owner's email (jonakfir@gmail.com) auto-populates
 * the profile with "Jonathan Kfir" and a canonical skills/interests set
 * the first time it renders, so there's always something to look at even
 * on a brand new install.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/ui/nav";
import { Footer } from "@/components/ui/footer";

const HARDCODED_ADMIN_EMAILS = [
  "jonakfir@gmail.com",
  "jonakfir@berkeley.edu",
];

// Pre-filled profile data for the owner account. If the owner signs in and
// their profiles row is empty, we'll populate these so the profile page is
// never blank.
const OWNER_EMAIL = "jonakfir@gmail.com";
const OWNER_DEFAULTS = {
  full_name: "Jonathan Kfir",
  experience_level: "expert",
  linkedin_url: "https://www.linkedin.com/in/jonathan-kfir/",
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Supabase",
    "PostgreSQL",
    "Tailwind CSS",
    "AI / LLM Integration",
  ],
  interests: [
    "SaaS",
    "Developer Tools",
    "AI Products",
    "Vibe Coding",
    "Indie Hacking",
  ],
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  skills: string[] | null;
  experience_level: string | null;
  interests: string[] | null;
  linkedin_url: string | null;
  resume_url: string | null;
  subscription_status: string | null;
  created_at: string | null;
};

function TagEditor({
  label,
  tags,
  onChange,
}: {
  label: string;
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div>
      <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-3">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs uppercase tracking-wide text-foreground font-body"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
              className="text-muted hover:text-foreground transition-colors ml-0.5"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              e.preventDefault();
              onChange([...tags, input.trim()]);
              setInput("");
            }
            if (e.key === "Backspace" && !input && tags.length > 0) {
              onChange(tags.slice(0, -1));
            }
          }}
          placeholder={tags.length ? "" : "Type and press enter"}
          className="bg-transparent outline-none text-foreground font-body text-[15px] flex-1 min-w-[140px]"
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const isAdmin = useMemo(
    () =>
      !!email && HARDCODED_ADMIN_EMAILS.includes(email.toLowerCase()),
    [email]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth?next=/profile");
        return;
      }
      if (cancelled) return;

      setUserId(user.id);
      setEmail(user.email ?? null);

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metaName =
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.name === "string" && meta.name) ||
        "";
      const metaAvatar =
        (typeof meta.avatar_url === "string" && meta.avatar_url) || null;
      setAvatarUrl(metaAvatar);

      // Load profile row
      const { data: row } = (await supabase
        .from("profiles")
        .select(
          "id, email, full_name, skills, experience_level, interests, linkedin_url, resume_url, subscription_status, created_at"
        )
        .eq("id", user.id)
        .maybeSingle()) as { data: ProfileRow | null };

      if (cancelled) return;

      const isOwner =
        (user.email ?? "").toLowerCase() === OWNER_EMAIL.toLowerCase();

      // Decide initial values: prefer existing row, fall back to OAuth
      // metadata, and for the owner account fall back to the hardcoded
      // defaults so the page is never blank.
      const initial = {
        full_name:
          row?.full_name ||
          metaName ||
          (isOwner ? OWNER_DEFAULTS.full_name : ""),
        experience_level:
          row?.experience_level ||
          (isOwner ? OWNER_DEFAULTS.experience_level : ""),
        skills:
          (row?.skills && row.skills.length > 0
            ? row.skills
            : isOwner
              ? OWNER_DEFAULTS.skills
              : []) ?? [],
        interests:
          (row?.interests && row.interests.length > 0
            ? row.interests
            : isOwner
              ? OWNER_DEFAULTS.interests
              : []) ?? [],
        linkedin_url:
          row?.linkedin_url ||
          (isOwner ? OWNER_DEFAULTS.linkedin_url : ""),
      };

      setFullName(initial.full_name);
      setExperienceLevel(initial.experience_level);
      setSkills(initial.skills);
      setInterests(initial.interests);
      setLinkedinUrl(initial.linkedin_url);
      setSubscriptionStatus(row?.subscription_status || "free");
      setCreatedAt(row?.created_at || null);

      // If owner has no row OR an empty row, persist the defaults so they
      // also show up in the admin user list and everywhere else.
      const rowLooksEmpty =
        !row ||
        (!row.full_name &&
          (!row.skills || row.skills.length === 0) &&
          !row.experience_level);
      if (isOwner && rowLooksEmpty) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email,
            full_name: initial.full_name,
            skills: initial.skills,
            experience_level: initial.experience_level,
            interests: initial.interests,
            linkedin_url: initial.linkedin_url,
          },
          { onConflict: "id" }
        );
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          experience_level: experienceLevel || null,
          skills,
          interests,
          linkedin_url: linkedinUrl || null,
        },
        { onConflict: "id" }
      );
      if (upsertError) {
        setError(upsertError.message);
      } else {
        setSavedAt(Date.now());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center">
          <p className="font-body text-small text-muted">Loading profile…</p>
        </main>
      </div>
    );
  }

  const initial = (fullName?.[0] || email?.[0] || "?").toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      <Nav />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-6 pt-32 pb-24">
        {/* Header card */}
        <section className="flex items-center gap-6">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName || "Avatar"}
              className="w-24 h-24 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border border-border bg-background flex items-center justify-center font-heading text-[40px]">
              {initial}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted">
              Signed in as
            </p>
            <h1 className="font-heading font-light text-4xl md:text-5xl text-foreground leading-tight truncate">
              {fullName || email?.split("@")[0] || "Your profile"}
            </h1>
            <p className="mt-1 font-body text-[14px] text-muted truncate">
              {email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-block border border-border px-2.5 py-1 text-[10px] uppercase tracking-wide font-body text-muted">
                {isAdmin ? "Admin" : "Member"}
              </span>
              <span className="inline-block border border-border px-2.5 py-1 text-[10px] uppercase tracking-wide font-body text-muted">
                Plan: {subscriptionStatus}
              </span>
              {createdAt && (
                <span className="inline-block border border-border px-2.5 py-1 text-[10px] uppercase tracking-wide font-body text-muted">
                  Joined {new Date(createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center font-body text-[12px] uppercase tracking-[0.15em] border border-border px-4 py-2.5 hover:border-foreground transition-colors"
          >
            Dashboard &rarr;
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center font-body text-[12px] uppercase tracking-[0.15em] border border-border px-4 py-2.5 hover:border-foreground transition-colors"
          >
            Generate ideas &rarr;
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center font-body text-[12px] uppercase tracking-[0.15em] border border-accent/60 text-accent px-4 py-2.5 hover:border-accent transition-colors"
            >
              Admin panel &rarr;
            </Link>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center font-body text-[12px] uppercase tracking-[0.15em] border border-border text-muted px-4 py-2.5 hover:border-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </section>

        {/* Edit form */}
        <form onSubmit={handleSave} className="mt-16 flex flex-col gap-10">
          <h2 className="font-heading font-light text-2xl text-foreground">
            Your details
          </h2>

          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Full name
            </p>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors"
            />
          </div>

          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              Experience level
            </p>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 appearance-none"
            >
              <option value="" className="bg-background">
                Select level
              </option>
              <option value="beginner" className="bg-background">
                Beginner
              </option>
              <option value="intermediate" className="bg-background">
                Intermediate
              </option>
              <option value="advanced" className="bg-background">
                Advanced
              </option>
              <option value="expert" className="bg-background">
                Expert
              </option>
            </select>
          </div>

          <TagEditor label="Skills" tags={skills} onChange={setSkills} />
          <TagEditor
            label="Interests"
            tags={interests}
            onChange={setInterests}
          />

          <div>
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
              LinkedIn URL
            </p>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full bg-transparent border-0 border-b border-border focus:border-foreground outline-none font-body text-[15px] text-foreground pb-2 transition-colors"
            />
          </div>

          <div className="flex items-center gap-6 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center bg-foreground text-background py-3 px-8 font-body text-[13px] uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
            {savedAt && (
              <span className="font-body text-[12px] text-muted">
                Saved.
              </span>
            )}
            {error && (
              <span className="font-body text-[12px] text-red-400">
                {error}
              </span>
            )}
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
