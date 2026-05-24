"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  planLabel: string;
  publicProfileHref: string;
};

export function AppMobileNavDrawer({ open, onClose, planLabel, publicProfileHref }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(100vw-2.5rem,280px)] flex-col",
          "border-r border-border/60 bg-[#050a12]/98 shadow-2xl",
        )}
      >
        <div className="flex items-center justify-end border-b border-border/60 px-2 py-2">
          <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <AppSidebarNav
          collapsed={false}
          planLabel={planLabel}
          publicProfileHref={publicProfileHref}
          onNavigate={onClose}
        />
      </aside>
    </div>
  );
}
