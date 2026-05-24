"use client";

import { useState, type ReactNode } from "react";
import { AppMobileNavDrawer } from "@/components/app/app-mobile-nav-drawer";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopBar } from "@/components/app/app-top-bar";
import {
  APP_SIDEBAR_WIDTH_COLLAPSED_PX,
  APP_SIDEBAR_WIDTH_EXPANDED_PX,
} from "@/components/app/app-sidebar-layout";

export function AppShell({
  children,
  publicProfileHref,
  displayName,
  planBadge,
  avatarUrl,
  /** Audiopost keeps premium dark UI even when global theme is Lumos. */
  audiopostDark = false,
}: {
  children: ReactNode;
  publicProfileHref: string;
  displayName: string;
  planBadge: string;
  avatarUrl?: string | null;
  audiopostDark?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className={
        audiopostDark
          ? "dark flex min-h-dvh bg-[#050a12] text-foreground"
          : "flex min-h-dvh bg-background"
      }
    >
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        publicProfileHref={publicProfileHref}
        planLabel={planBadge}
      />
      <AppMobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        planLabel={planBadge}
        publicProfileHref={publicProfileHref}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          displayName={displayName}
          planBadge={planBadge}
          avatarUrl={avatarUrl}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden max-lg:[--app-sidebar-width:0px]"
          style={{
            ["--app-sidebar-width" as string]: collapsed
              ? `${APP_SIDEBAR_WIDTH_COLLAPSED_PX}px`
              : `${APP_SIDEBAR_WIDTH_EXPANDED_PX}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
