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
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={cn(
          "dark absolute inset-y-0 left-0 z-10 isolate flex w-[min(100vw-2.5rem,280px)] flex-col",
          "border-r border-white/10 bg-[#050a12] text-foreground shadow-[4px_0_32px_rgba(0,0,0,0.5)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-white/10 bg-[#050a12] px-2 py-2">
          <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#050a12]">
          <AppSidebarNav
            collapsed={false}
            planLabel={planLabel}
            publicProfileHref={publicProfileHref}
            isAdmin={isAdmin}
            onNavigate={onClose}
          />
        </div>
        <div className="shrink-0 border-t border-white/10 bg-[#050a12] p-3">
          <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => void onSignOut()}>
            {t.common.signOut}
          </Button>
        </div>
      </aside>
    </div>
  );
}
