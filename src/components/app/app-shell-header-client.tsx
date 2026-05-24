"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AppMobileNavDrawer } from "@/components/app/app-mobile-nav-drawer";
import { AppNav } from "@/components/app/app-nav";
import { AppShellHeaderGuestDrawer } from "@/components/app/app-shell-header-guest-drawer";
import { ProfileGlobalSearch } from "@/components/app/profile-global-search";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { Button } from "@/components/ui/button";

type Props = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  publicProfileHref: string;
  planBadge: string;
  openAppLabel: string;
  signInLabel: string;
};

export function AppShellHeaderClient({
  isAuthenticated,
  isAdmin,
  publicProfileHref,
  planBadge,
  openAppLabel,
  signInLabel,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0"
            aria-label="Open navigation menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/app/explore" className="shrink-0">
            <EchonXLogo size="mini" />
          </Link>
          <ProfileGlobalSearch className="min-w-0 flex-1" />
          <LanguageSelector compact />
        </div>

        <div className="mx-auto hidden max-w-6xl grid-cols-1 items-center gap-3 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] lg:gap-4 lg:px-8">
          <div className="min-w-0">
            <Link href="/app/explore" className="inline-flex items-center">
              <EchonXLogo />
            </Link>
          </div>
          <ProfileGlobalSearch className="mx-auto w-full max-w-md lg:max-w-xs xl:max-w-sm" />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <LanguageSelector compact />
            {isAuthenticated ? (
              <AppNav isAdmin={isAdmin} publicProfileHref={publicProfileHref} />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/explore">{openAppLabel}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/login?callbackUrl=%2Fapp%2Fexplore">{signInLabel}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated ? (
        <AppMobileNavDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          planLabel={planBadge}
          publicProfileHref={publicProfileHref}
          isAdmin={isAdmin}
        />
      ) : (
        <AppShellHeaderGuestDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      )}
    </>
  );
}
