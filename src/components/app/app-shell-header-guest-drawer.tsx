"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AppShellHeaderGuestDrawer({ open, onClose }: Props) {
  const { dictionary: t } = useI18n();

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

  const links = [
    { href: "/pricing", label: t.common.pricing },
    { href: "/about", label: t.common.about },
    { href: "/faq", label: t.common.faq },
  ];

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
          "absolute inset-y-0 left-0 z-10 isolate flex w-[min(100vw-2.5rem,280px)] flex-col",
          "border-r border-border/60 bg-background shadow-[4px_0_32px_rgba(0,0,0,0.35)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-end border-b border-border/60 bg-background px-2 py-2">
          <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 bg-background p-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-2 border-t border-border/60" />
          <LanguageSelector />
          <Button className="mt-3 min-h-11 w-full" asChild>
            <Link href="/login?callbackUrl=%2Fapp%2Fexplore" onClick={onClose}>
              {t.common.signIn}
            </Link>
          </Button>
          <Button className="min-h-11 w-full" variant="outline" asChild>
            <Link href="/app/explore" onClick={onClose}>
              {t.common.openApp}
            </Link>
          </Button>
        </nav>
      </aside>
    </div>
  );
}
