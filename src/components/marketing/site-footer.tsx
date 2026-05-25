import Link from "next/link";
import { EchonXFooterLogo } from "@/components/brand/echonx-footer-logo";

const PRODUCT_LINKS = [
  { href: "/app/explore", label: "Explore" },
  { href: "/app", label: "Audiopost" },
  { href: "/pricing", label: "Pricing" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const RESOURCE_LINKS = [
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/about", label: "About" },
] as const;

const SOCIAL = [{ href: "https://x.com/_Qubic_", label: "Qubic on X", letter: "𝕏" }] as const;

export async function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <EchonXFooterLogo href="/" />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Profile-first social listening. Hear creators, follow with intention, and grow communities around voice.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">© {year} EchonX. All rights reserved.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Resources</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Follow us</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.letter}
                </a>
              ))}
            </div>
          </div>
        </div>

        <nav
          className="mt-10 flex w-full flex-wrap items-center justify-evenly gap-x-4 gap-y-2 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:justify-center sm:gap-x-10"
          aria-label="Legal"
        >
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
