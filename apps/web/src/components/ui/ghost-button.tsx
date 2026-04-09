import Link from "next/link";

export function GhostButton({
  href,
  children,
  className = "",
  onClick,
  ...rest
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  if (onClick && !href) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-6 py-2.5 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground transition-colors duration-300 ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <Link
      href={href || "#"}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-6 py-2.5 font-body text-sm text-foreground border border-border rounded-full hover:border-foreground transition-colors duration-300 ${className}`}
    >
      {children}
    </Link>
  );
}

export default GhostButton;
