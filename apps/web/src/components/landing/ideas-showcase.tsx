"use client";

import { useState } from "react";
import { SectionReveal } from "@/components/ui/section-reveal";
import { IdeaCard } from "@/components/ui/idea-card";

const ideas = [
  {
    sector: "Developer Tools",
    name: "CodeReview Bot",
    description:
      "An AI-powered code review assistant that catches bugs, suggests refactors, and enforces style guides before your team even opens a PR.",
    metadata: {
      market_size: "$4.2B",
      competition: "Medium",
      time_to_mvp: "3 weeks",
    },
  },
  {
    sector: "Creator Economy",
    name: "Thumbnail AI",
    description:
      "Generate scroll-stopping YouTube thumbnails in seconds. Trained on top-performing creators to maximize click-through rates.",
    metadata: {
      market_size: "$1.8B",
      competition: "Low",
      time_to_mvp: "2 weeks",
    },
  },
  {
    sector: "Productivity",
    name: "MeetingMind",
    description:
      "Turns every meeting into structured notes, action items, and follow-ups — automatically synced to your project management tool.",
    metadata: {
      market_size: "$6.1B",
      competition: "High",
      time_to_mvp: "4 weeks",
    },
  },
];

const rotations = ["-2deg", "0deg", "2deg"];

export function IdeasShowcase() {
  const [selected, setSelected] = useState<number>(-1);

  return (
    <section className="relative py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionReveal>
          <h2 className="font-heading font-light text-display text-foreground">
            What you&apos;ll get.
          </h2>
        </SectionReveal>

        <div className="mt-16 flex flex-col md:flex-row items-start">
          {ideas.map((idea, i) => (
            <SectionReveal
              key={idea.name}
              delay={i * 0.15}
              className={`w-full md:w-[380px] flex-shrink-0 ${
                i > 0 ? "md:-ml-6" : ""
              }`}
            >
              <div
                style={{
                  transform: `rotate(${rotations[i]})`,
                }}
              >
                <IdeaCard
                  sector={idea.sector}
                  name={idea.name}
                  description={idea.description}
                  metadata={idea.metadata}
                  onSelect={() => setSelected(i)}
                  selected={selected === i}
                />
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
