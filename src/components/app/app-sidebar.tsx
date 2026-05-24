"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Compass,
  Headphones,
  PanelLeftClose,
  Settings,
  User,
} from "lucide-react";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  APP_SHELL_HEADER_HEIGHT_PX,
  APP_SIDEBAR_WIDTH_COLLAPSED_PX,
  APP_SIDEBAR_WIDTH_EXPANDED_PX,
  AUDIOPOST_BOTTOM_BAR_HEIGHT_PX,
  AUDIOPOST_BOTTOM_BAR_LIFT_PX,
} from "@/components/app/app-sidebar-layout";

const NAV_ICONS = {
  audiopost: Headphones,
  explore: Compass,
  library: BookOpen,
  profile: User,
  settings: Settings,
} as const;

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
  const pathname = usePathname();
  const { dictionary: t } = useI18n();

  const links = [
    { key: "audiopost" as const, href: "/app", label: t.nav.audiopost, exact: true },
    { key: "explore" as const, href: "/app/explore", label: t.nav.explore },
    { key: "library" as const, href: "/app#library", label: "Library" },
    { key: "profile" as const, href: publicProfileHref, label: t.nav.profile },
    { key: "settings" as const, href: "/app/settings", label: t.nav.settings },
  ];

  return (
    <aside
      className="relative flex min-h-dvh shrink-0 flex-col border-r border-border/60 bg-[#050a12]/95 transition-[width] duration-200"
      style={{ width: collapsed ? APP_SIDEBAR_WIDTH_COLLAPSED_PX : APP_SIDEBAR_WIDTH_EXPANDED_PX }}
    >
      <div
        className={cn(
          "flex shrink-0 flex-col justify-center border-b border-border/60 px-4",
          collapsed && "items-center px-2",
        )}
        style={{ minHeight: APP_SHELL_HEADER_HEIGHT_PX }}
      >
        <Link href="/app/explore" className="inline-flex min-w-0" title={t.nav.explore}>
          <EchonXLogo size={collapsed ? "compact" : "header"} />
        </Link>
        {!collapsed ? (
          <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground/75">{t.marketing.badge}</p>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
        {links.map((link) => {
          const Icon = NAV_ICONS[link.key];
          const active =
            link.key === "library"
              ? pathname === "/app"
              : link.exact
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-normal tracking-wide transition-colors",
                active
                  ? "bg-primary/10 text-primary/95 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary/80"
                  : "text-muted-foreground/90 hover:bg-white/[0.04] hover:text-foreground/90",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? link.label : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-70")} />
              {!collapsed ? <span className="not-italic">{link.label}</span> : null}
            </Link>
          );
        })}

        {!collapsed ? <div id="sidebar-credits-slot" className="mt-auto min-h-[4.5rem] px-3" /> : null}
      </nav>

      {!collapsed ? (
        <div className="mx-2.5 mb-2.5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-3.5">
          <p className="text-xs font-semibold text-foreground">{planLabel}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Unlimited listening, priority sync, and more voices in your queue.
          </p>
          <Button size="sm" className="mt-3 w-full" asChild>
            <Link href="/app/settings/billing">Manage Plan</Link>
          </Button>
        </div>
      ) : null}

      <div
        className="mt-auto shrink-0 border-t border-white/[0.06]"
        style={{ height: AUDIOPOST_BOTTOM_BAR_HEIGHT_PX, marginBottom: AUDIOPOST_BOTTOM_BAR_LIFT_PX }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-10 w-full items-center justify-center gap-1 text-[11px] font-normal text-muted-foreground/90 hover:bg-white/[0.04] hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
