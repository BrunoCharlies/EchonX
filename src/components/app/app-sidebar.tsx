"use client";

import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import {
  APP_SIDEBAR_WIDTH_COLLAPSED_PX,
  APP_SIDEBAR_WIDTH_EXPANDED_PX,
} from "@/components/app/app-sidebar-layout";

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  publicProfileHref,
  planLabel,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  publicProfileHref: string;
  planLabel: string;
}) {
  return (
    <aside
      className="relative hidden min-h-dvh shrink-0 flex-col border-r border-border/60 bg-[#050a12]/95 transition-[width] duration-200 lg:flex"
      style={{ width: collapsed ? APP_SIDEBAR_WIDTH_COLLAPSED_PX : APP_SIDEBAR_WIDTH_EXPANDED_PX }}
    >
      <AppSidebarNav
        collapsed={collapsed}
        planLabel={planLabel}
        publicProfileHref={publicProfileHref}
        showCollapseControl
        onToggleCollapse={onToggleCollapse}
      />
    </aside>
  );
}
