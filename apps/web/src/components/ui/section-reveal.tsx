"use client";

interface SectionRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function SectionReveal({
  children,
  className,
}: SectionRevealProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
