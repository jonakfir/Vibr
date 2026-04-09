import Link from "next/link";

const footerLinks = [
  { label: "AI Idea Generator", href: "/ideas" },
  { label: "Local AI IDE", href: "/local-ide" },
  { label: "Find Marketers", href: "/find-marketers" },
  { label: "AI Outreach", href: "/outreach" },
  { label: "Pricing", href: "/pricing" },
  { label: "Download", href: "/download" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div>
            <Link href="/" className="font-heading font-light text-[28px] text-foreground">
              Vibr
            </Link>
            <p className="font-body text-small text-muted mt-2">
              <a href="mailto:contact@vibr.ai" className="hover:text-foreground transition-colors">
                contact@vibr.ai
              </a>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-x-12 gap-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-small text-muted hover:text-foreground transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="font-body text-xs text-muted/50 mt-12">
          &copy; 2026 Vibr. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
