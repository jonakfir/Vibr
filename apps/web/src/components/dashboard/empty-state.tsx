import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-border rounded-[4px] p-10 text-center">
      <p className="font-heading font-light text-xl text-foreground mb-2">{title}</p>
      <p className="font-body text-sm text-muted mb-5 max-w-[440px] mx-auto leading-relaxed">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground transition-colors duration-300"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
