import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Product", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Download", href: "/download" },
  { label: "Sign in", href: "/sign-in" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex justify-between items-start">
          <div>
            <Link
              href="/"
              className="font-heading font-light text-[20px] text-foreground"
            >
              Vibr
            </Link>
            <p className="font-body text-small text-muted mt-4">
              <a
                href="mailto:hello@vibr.ai"
                className="hover:text-foreground transition-colors duration-300"
              >
                hello@vibr.ai
              </a>
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-16 gap-y-3">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-small text-muted hover:text-foreground transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="font-body text-xs text-muted/50 mt-16">
          &copy; 2026 Vibr. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
