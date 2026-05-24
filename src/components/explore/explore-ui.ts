import { cn } from "@/lib/utils";

/** Cards follow global theme (Lumos / dark) via design tokens. */
export function exploreCardClass(extra?: string) {
  return cn(
    "rounded-2xl border border-border/60 bg-card/95 shadow-sm backdrop-blur-sm",
    "dark:border-white/[0.08] dark:bg-card/90 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
    extra,
  );
}

export function exploreSectionTitleClass() {
  return "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
}

export function explorePillActive(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.25)]"
      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
  );
}

/** Subtle surfaces that adapt to Lumos vs dark. */
export function exploreInsetClass(extra?: string) {
  return cn("border border-border/40 bg-muted/25 dark:border-white/[0.06] dark:bg-white/[0.02]", extra);
}
