"use client";

import { SectionReveal } from "@/components/ui/section-reveal";
import { MarketerCard } from "@/components/ui/marketer-card";

const marketers = [
  {
    name: "Sarah Chen",
    photo: "https://ui-avatars.com/api/?name=Sarah+Chen&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg",
    headline: "Growth Lead @ TechStartup",
    matchPercent: 94,
  },
  {
    name: "Marcus Rivera",
    photo: "https://ui-avatars.com/api/?name=Marcus+Rivera&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg",
    headline: "B2B SaaS Marketing, ex-HubSpot",
    matchPercent: 87,
  },
  {
    name: "Anika Patel",
    photo: "https://ui-avatars.com/api/?name=Anika+Patel&background=1E1E1E&color=F2EFE9&size=160&bold=true&format=svg",
    headline: "DevTools GTM Consultant",
    matchPercent: 82,
  },
];

export function MarketerSection() {
  return (
    <section className="relative py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <SectionReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {marketers.map((m, i) => (
              <MarketerCard
                key={m.name}
                name={m.name}
                photo={m.photo}
                headline={m.headline}
                matchPercent={m.matchPercent}
                onSelect={() => {}}
              />
            ))}
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <h2 className="font-heading font-light text-title text-foreground">
            We find the people who will sell it for you.
          </h2>
          <div className="mt-8 space-y-4">
            <p className="font-body font-light text-body text-muted leading-relaxed">
              Once your product is built, Vibr scans LinkedIn to find marketers
              whose experience aligns with your sector, audience, and go-to-market
              strategy. Each match is scored by relevance, not popularity.
            </p>
            <p className="font-body font-light text-body text-muted leading-relaxed">
              Then it drafts personalized cold emails through Firstline — not
              generic templates, but messages that reference their work, speak
              their language, and give them a reason to reply.
            </p>
            <p className="font-body font-light text-body text-muted leading-relaxed">
              You review, edit if you want, and send. The right person is often
              one conversation away.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
