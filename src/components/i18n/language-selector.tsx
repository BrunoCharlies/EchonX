"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_OPTIONS, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { locale, setLocale, dictionary } = useI18n();
  const [open, setOpen] = useState(false);
  const selectedOption = LOCALE_OPTIONS.find((option) => option.value === locale) ?? LOCALE_OPTIONS[0];

  function selectLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground",
          compact && "px-2",
        )}
        aria-label={dictionary.common.language}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          aria-hidden="true"
          className="h-3.5 w-5 rounded-[2px] bg-cover bg-center shadow-sm ring-1 ring-white/20"
          style={{ backgroundImage: `url(${selectedOption.flagPath})` }}
        />
        <span className={compact ? "sr-only" : "hidden sm:inline"}>{dictionary.common.language}</span>
        <span className="font-medium text-foreground">{compact ? selectedOption.shortLabel : selectedOption.label}</span>
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 min-w-32 rounded-lg border border-border/70 bg-popover p-1 text-xs shadow-xl">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground hover:bg-secondary hover:text-foreground",
                option.value === locale && "bg-secondary text-foreground",
              )}
              onClick={() => selectLocale(option.value)}
            >
              <span
                aria-hidden="true"
                className="h-3.5 w-5 rounded-[2px] bg-cover bg-center shadow-sm ring-1 ring-white/20"
                style={{ backgroundImage: `url(${option.flagPath})` }}
              />
              <span className="font-medium">{option.shortLabel}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
