"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface IdeaCardProps {
  sector: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  onSelect: () => void;
  selected: boolean;
}

export function IdeaCard({
  sector,
  name,
  description,
  metadata,
  onSelect,
  selected,
}: IdeaCardProps) {
  return (
    <motion.div
      className={clsx(
        "bg-card border p-6 flex flex-col justify-between min-h-[320px] rounded-[4px] transition-colors duration-300 cursor-pointer",
        selected ? "border-accent" : "border-card-border"
      )}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onSelect}
    >
      <div>
        <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-4">
          {sector}
        </p>
        <h3 className="font-heading font-light text-subtitle text-foreground mb-3">
          {name}
        </h3>
        <p className="font-body font-light text-small text-muted leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5">
          {Object.entries(metadata).map(([key, val]) => (
            <div key={key}>
              <p className="font-body text-[10px] uppercase tracking-wide text-muted mb-0.5">
                {key.replace(/_/g, " ")}
              </p>
              <p className="font-body text-small text-foreground">{val}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="font-body text-small text-foreground hover:text-accent transition-colors duration-300 group"
        >
          {selected ? "Selected" : "Select"}{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
            &rarr;
          </span>
        </button>
      </div>
    </motion.div>
  );
}
