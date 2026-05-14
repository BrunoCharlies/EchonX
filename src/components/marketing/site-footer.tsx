import Link from "next/link";

const footerLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "/explore", label: "Explore" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/faq", label: "FAQ" },
  { href: "https://developer.x.com/", label: "X API", external: true },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight">EchonX</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Profile-first listening for people who want signal, not an infinite scroll. Built for the United States in
            American English.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {footerLinks.map((link) =>
            link.external ? (
              <a key={link.href} href={link.href} className="hover:text-foreground" target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ),
          )}
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EchonX. All rights reserved.
      </div>
    </footer>
  );
}
