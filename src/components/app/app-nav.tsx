"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function getLinks(publicProfileHref: string, labels: ReturnType<typeof useI18n>["dictionary"]["nav"]) {
  return [
    { href: "/app/explore", label: labels.explore },
    { href: "/app", label: labels.audiopost },
    { href: publicProfileHref, label: labels.profile },
    { href: "/app/settings", label: labels.settings },
  ];
}

export function AppNav({ isAdmin = false, publicProfileHref = "/app/onboarding" }: { isAdmin?: boolean; publicProfileHref?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dictionary: t } = useI18n();
  const links = getLinks(publicProfileHref, t.nav);
  const visibleLinks = isAdmin ? [...links, { href: "/admin", label: t.nav.admin }] : links;

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            (pathname === link.href || (link.href !== "/app" && pathname.startsWith(link.href))) && "bg-secondary text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
      <Button variant="ghost" size="sm" type="button" onClick={() => void onSignOut()}>
        {t.common.signOut}
      </Button>
    </div>
  );
}
