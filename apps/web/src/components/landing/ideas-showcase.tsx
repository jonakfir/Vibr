"use client";

/**
 * "Here's what you can build." — showcase of example idea cards on the
 * landing page. Previously this section wrapped every card in a
 * `FadeInOnScroll` / `StaggerChildren` that starts at opacity 0 and relied
 * on `useInView` to reveal them. In certain scroll / layout scenarios the
 * observer never fired and the whole section appeared blank. Since this is
 * static marketing content, we drop the scroll-triggered animation and
 * always render the cards visible — a one-shot fade-in via CSS keeps it
 * feeling alive without any chance of getting stuck invisible.
 */

const ideas = [
  {
    name: "CodeReview Bot",
    category: "Developer Tools",
    desc: "An AI-powered code review assistant that catches bugs, suggests refactors, and enforces style guides across your repos.",
    market: "$4.2B",
    time: "3 weeks to MVP",
    competition: "Medium",
  },
  {
    name: "Thumbnail AI",
    category: "Creator Tools",
    desc: "Generate scroll-stopping YouTube thumbnails using AI trained on top-performing content in your niche.",
    market: "$1.8B",
    time: "2 weeks to MVP",
    competition: "Growing",
  },
  {
    name: "MeetingMind",
    category: "Productivity",
    desc: "An AI note-taker that joins your meetings, extracts action items, and syncs them to your project management tools.",
    market: "$6.1B",
    time: "4 weeks to MVP",
    competition: "High",
  },
];

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
      <div className="relative bg-[#0a0a0a] border border-white/[0.08] rounded-lg overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
        {children}
      </div>
    </div>
  );
}

export default function IdeasShowcase() {
  return (
    <section className="relative py-32 bg-background/85 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="font-heading font-light text-display text-foreground">
          Here&apos;s what you can build.
        </h2>
        <p className="mt-6 font-body font-light text-body text-muted max-w-[640px] leading-relaxed">
          Real, shippable SaaS ideas matched to real market demand. Each one
          comes with a pitch, a tech stack, and a Claude Code prompt so you
          can start building the same day.
        </p>

        <div className="mt-16 flex flex-col md:flex-row items-start gap-6">
          {/* Featured card */}
          <div className="w-full md:w-[380px] flex-shrink-0">
            <Card>
              <div className="p-6 flex flex-col justify-between min-h-[320px]">
                <div>
                  <span className="font-body text-[10px] uppercase tracking-widest text-muted/80">
                    {ideas[0].category}
                  </span>
                  <h3 className="font-heading font-light text-[32px] text-foreground mt-2">
                    {ideas[0].name}
                  </h3>
                  <p className="font-body text-small text-muted mt-3 leading-relaxed">
                    {ideas[0].desc}
                  </p>
                </div>
                <div className="mt-6 flex justify-between items-end">
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-wide text-muted/70">
                      market size
                    </p>
                    <p className="font-heading text-[28px] text-foreground">
                      {ideas[0].market}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-[10px] uppercase tracking-wide text-muted/70">
                      timeline
                    </p>
                    <p className="font-body text-small text-foreground/80">
                      {ideas[0].time}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Side cards */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            {ideas.slice(1).map((idea) => (
              <Card key={idea.name}>
                <div className="p-6 flex flex-col justify-between min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-body text-[10px] uppercase tracking-widest text-muted/80">
                        {idea.category}
                      </span>
                      <h3 className="font-heading font-light text-[24px] text-foreground mt-1">
                        {idea.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-[24px] text-foreground">
                        {idea.market}
                      </p>
                      <p className="font-body text-[10px] text-muted/70">
                        {idea.time}
                      </p>
                    </div>
                  </div>
                  <p className="font-body text-small text-muted mt-3 leading-relaxed">
                    {idea.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="/onboarding"
            className="font-body text-small text-muted hover:text-foreground transition-colors duration-300 underline underline-offset-4 decoration-white/10 hover:decoration-white/30"
          >
            See all ideas tailored to you &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
