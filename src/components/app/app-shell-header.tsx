import Link from "next/link";
import { auth } from "@/auth";
import { AppNav } from "@/components/app/app-nav";
import { ProfileGlobalSearch } from "@/components/app/profile-global-search";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { Button } from "@/components/ui/button";
import { getServerDictionary } from "@/lib/i18n/server";

export async function AppShellHeader() {
  const session = await auth();
  const t = await getServerDictionary();
  const publicProfileHref = session?.user.twitterUsername
    ? `/u/${session.user.twitterUsername}`
    : "/app/onboarding";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] lg:gap-4 lg:px-8">
        <div className="min-w-0">
          <Link href="/app/explore" className="inline-flex items-center">
            <EchonXLogo />
          </Link>
        </div>
        <ProfileGlobalSearch className="mx-auto w-full max-w-md lg:max-w-xs xl:max-w-sm" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LanguageSelector compact />
          {session ? (
            <AppNav isAdmin={session.user.role === "admin"} publicProfileHref={publicProfileHref} />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/explore">{t.common.openApp}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login?callbackUrl=%2Fapp%2Fexplore">{t.common.signIn}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
