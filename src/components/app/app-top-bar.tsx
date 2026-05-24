"use client";

import { Bell } from "lucide-react";
import { ProfileGlobalSearch } from "@/components/app/profile-global-search";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppTopBar({
  displayName,
  planBadge,
  avatarUrl,
}: {
  displayName: string;
  planBadge: string;
  avatarUrl?: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <ProfileGlobalSearch className="mx-auto w-full max-w-xl" />
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSelector compact />
        <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 py-1 pl-1 pr-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-sm font-semibold text-primary",
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-[10px] text-primary">{planBadge}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
