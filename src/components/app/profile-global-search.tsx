"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

type SearchResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_path: string | null;
};

function initials(displayName: string | null, username: string) {
  return (displayName ?? username).slice(0, 2).toUpperCase();
}

export function ProfileGlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { dictionary: t } = useI18n();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (value: string) => {
    const trimmed = value.replace(/^@/, "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(trimmed)}&native=1`);
      if (!response.ok) throw new Error("search failed");
      const payload = (await response.json()) as { results: SearchResult[] };
      setResults(payload.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = query.replace(/^@/, "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToProfile(username: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/u/${username}`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.replace(/^@/, "").trim();
    if (!trimmed) return;
    if (results[0]) {
      goToProfile(results[0].username);
      return;
    }
    router.push(`/app/discover?q=${encodeURIComponent(trimmed)}&native=1`);
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form onSubmit={onSubmit} role="search">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/80" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t.nav.profileSearchPlaceholder}
          aria-label={t.nav.profileSearchPlaceholder}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listId : undefined}
          autoComplete="off"
          className="h-8 w-full rounded-full border border-border/50 bg-background/30 py-1 pl-8 pr-3 text-xs text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-border/80 focus:border-primary/35 focus:bg-background/50 focus:ring-1 focus:ring-primary/15"
        />
      </form>

      {showDropdown ? (
        <div
          id={listId}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur-md"
        >
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">{t.nav.profileSearchLoading}</p>
          ) : results.length ? (
            <ul role="listbox" className="max-h-64 overflow-y-auto">
              {results.map((profile) => (
                <li key={profile.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-secondary/80"
                    onClick={() => goToProfile(profile.username)}
                  >
                    <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/50 bg-secondary">
                      {profile.avatar_path ? (
                        <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="32px" unoptimized />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                          {initials(profile.display_name, profile.username)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium leading-tight">
                        {profile.display_name ?? `@${profile.username}`}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">@{profile.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">{t.nav.profileSearchEmpty}</p>
          )}
          <div className="border-t border-border/50 px-2 py-1.5">
            <Link
              href={`/app/discover?q=${encodeURIComponent(query.replace(/^@/, "").trim())}&native=1`}
              className="block rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {t.nav.profileSearchSeeAll}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
