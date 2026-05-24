"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  planLabel: string;
  publicProfileHref: string;
  isAdmin?: boolean;
};

export function AppMobileNavDrawer({ open, onClose, planLabel, publicProfileHref, isAdmin = false }: Props) {
  const router = useRouter();
  const { dictionary: t } = useI18n();

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  }

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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <AppSidebarNav
            collapsed={false}
            planLabel={planLabel}
            publicProfileHref={publicProfileHref}
            isAdmin={isAdmin}
            onNavigate={onClose}
          />
        </div>
        <div className="shrink-0 border-t border-border/60 p-3">
          <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => void onSignOut()}>
            {t.common.signOut}
          </Button>
        </div>
      </aside>
    </div>
  );
}
