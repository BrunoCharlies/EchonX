"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MoreVertical, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { dictionary: t } = useI18n();
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isProfilePage = pathname.startsWith("/u/");
  if (isProfilePage) {
    return null;
  }
  const links = [
    { href: "/pricing", label: t.common.pricing },
    { href: "/about", label: t.common.about },
    { href: "/faq", label: t.common.faq },
  ];

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={isProfilePage ? "/app/explore" : "/"} className="flex shrink-0 items-center">
          <EchonXLogo priority />
        </Link>

        {!isProfilePage ? (
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "border-b-2 pb-0.5 transition-colors hover:text-foreground",
                  pathname === link.href
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="hidden items-center gap-3 lg:flex">
          {!isProfilePage ? <LanguageSelector compact /> : null}
          {isProfilePage ? (
            <>
              <Button variant="ghost" onClick={() => void onSignOut()}>
                {t.common.signOut}
              </Button>
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Profile menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((value) => !value)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {profileMenuOpen ? (
                  <div className="absolute right-0 top-11 w-44 rounded-xl border border-border/70 bg-popover p-1 text-sm shadow-xl">
                    <Link
                      href="/app/onboarding"
                      className="block rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      {t.nav.profile}
                    </Link>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/app/explore">{t.common.openApp}</Link>
              </Button>
              <Button asChild>
                <Link href="/login?callbackUrl=%2Fapp%2Fexplore">{t.common.signIn}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/60 bg-background/95 lg:hidden"
          >
            <div className="flex flex-col gap-3 px-4 py-4 text-sm">
              {isProfilePage ? (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/app/onboarding" onClick={() => setOpen(false)}>
                      {t.nav.profile}
                    </Link>
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setOpen(false);
                      void onSignOut();
                    }}
                  >
                    {t.common.signOut}
                  </Button>
                </>
              ) : (
                <>
                  <LanguageSelector />
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-muted-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Button className="w-full" asChild>
                    <Link href="/login?callbackUrl=%2Fapp%2Fexplore" onClick={() => setOpen(false)}>
                      {t.common.signIn}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/app/explore" onClick={() => setOpen(false)}>
                      {t.common.openApp}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
