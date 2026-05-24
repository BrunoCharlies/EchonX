"use client";

import { useState, type ReactNode } from "react";
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
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar displayName={displayName} planBadge={planBadge} avatarUrl={avatarUrl} />
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
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
