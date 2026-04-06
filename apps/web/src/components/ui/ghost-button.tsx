"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";

interface GhostButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function GhostButton({
  children,
  href,
  onClick,
  className,
}: GhostButtonProps) {
  const inner = (
    <motion.span
      className={clsx(
        "relative inline-flex items-center gap-1.5 font-body text-foreground text-sm tracking-normal cursor-pointer group",
        className
      )}
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <span>{children}</span>
      <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
        &rarr;
      </span>
      <motion.span
        className="absolute bottom-0 left-0 h-px bg-foreground"
        variants={{
          rest: { width: "0%" },
          hover: { width: "100%" },
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.span>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return (
    <button type="button" onClick={onClick}>
      {inner}
    </button>
  );
}
