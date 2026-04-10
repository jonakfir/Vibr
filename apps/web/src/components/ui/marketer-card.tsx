"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface MarketerCardProps {
  name: string;
  photo: string;
  headline: string;
  matchPercent: number;
  onSelect: () => void;
  className?: string;
}

export function MarketerCard({
  name,
  photo,
  headline,
  matchPercent,
  onSelect,
  className,
}: MarketerCardProps) {
  return (
    <motion.div
      className={clsx(
        "bg-card border border-card-border rounded-[4px] p-6 flex flex-col items-center text-center cursor-pointer transition-colors duration-300 hover:border-muted",
        className
      )}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onSelect}
    >
      <div className="w-20 h-20 rounded-full overflow-hidden mb-5">
        <img
          src={photo}
          alt={name}
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <h3 className="font-heading font-light text-[28px] text-foreground mb-1">
        {name}
      </h3>
      <p className="font-body font-light text-small text-muted mb-6 max-w-[240px]">
        {headline}
      </p>

      <div className="mt-auto">
        <p className="font-heading font-light text-[48px] leading-none text-foreground">
          {matchPercent}%
        </p>
        <p className="font-body text-[10px] uppercase tracking-wide text-muted mt-1">
          match
        </p>
      </div>
    </motion.div>
  );
}
