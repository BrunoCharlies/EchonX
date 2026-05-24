"use client";

import { FormEvent, useState, useTransition } from "react";
import { Clock, Search, X } from "lucide-react";
import { useAudiopostLibrary } from "@/contexts/audiopost-library-context";
import type { PdfReadingSource } from "@/components/app/pdf-reading-player";
import { audiopostCardClass, audiopostCardPadding, audiopostSectionLabelClass } from "@/components/app/audiopost-premium";
import { librarySourceProxyUrl } from "@/lib/library/library-source-url";
import type { RecommendedReadingItem } from "@/server/actions/recommended-reading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  GUTENBERG_BY_CATEGORY,
  LIBRARY_TABS,
  type LibraryTab,
} from "@/lib/audiopost/gutenberg-library";

const TABS = LIBRARY_TABS;

type LibraryDisplayBook = {
  id: string;
  title: string;
  author: string;
  duration: string;
  coverUrl: string;
  sourceUrl: string;
};

type SearchResultBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  sourceUrl: string;
};

const MOCK_BOOKS: LibraryDisplayBook[] = [
  {
    id: "mock-pragmatic",
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    duration: "6h 24m",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.txt",
  },
  {
    id: "mock-sapiens",
    title: "Sapiens",
    author: "Yuval Harari",
    duration: "8h 12m",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.txt",
  },
  {
    id: "mock-habits",
    title: "Atomic Habits",
    author: "James Clear",
    duration: "5h 40m",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/11/pg11.txt",
  },
  {
    id: "mock-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    duration: "4h 18m",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/84/pg84.txt",
  },
  {
    id: "mock-thinking",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    duration: "7h 05m",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.txt",
  },
];

function bookToSource(book: Pick<LibraryDisplayBook, "id" | "title" | "author" | "sourceUrl">): PdfReadingSource {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    sourceType: "text",
    sourceUrl: librarySourceProxyUrl(book.sourceUrl),
  };
}

function echonxRecommendationToSource(item: RecommendedReadingItem): PdfReadingSource {
  return {
    id: `echonx-${item.slot}`,
    title: item.title,
    author: item.author ?? "EchonX",
    sourceType: item.documentType,
    sourceUrl: librarySourceProxyUrl(item.documentUrl),
  };
}

function LibraryBookTile({
  book,
  selected,
  onSelect,
}: {
  book: LibraryDisplayBook;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-[72px] shrink-0 flex-col items-center text-center transition-transform duration-200 hover:scale-[1.03]"
    >
      <div
        className={cn(
          "h-[88px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-secondary",
          selected && "ring-2 ring-primary/50",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={book.coverUrl} alt="" className="block h-full w-full object-cover object-top" loading="lazy" />
      </div>
      <p className="mt-2 h-[26px] w-full line-clamp-2 text-[10px] font-medium leading-[13px] text-foreground">{book.title}</p>
      <p className="mt-0.5 h-[11px] w-full truncate text-[9px] leading-[11px] text-muted-foreground">{book.author}</p>
      <p className="mt-0.5 flex h-[11px] w-full items-center justify-center gap-0.5 text-[9px] leading-none text-muted-foreground">
        <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden />
        <span className="truncate">{book.duration}</span>
      </p>
    </button>
  );
}

export function AudiopostLibrarySection({
  fixedRecommendation,
}: {
  fixedRecommendation: RecommendedReadingItem | null;
}) {
  const { selectedSource, setSelectedSource } = useAudiopostLibrary();
  const [activeTab, setActiveTab] = useState<LibraryTab>("Recommended");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<LibraryDisplayBook[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  const catalogBooks: LibraryDisplayBook[] =
    activeTab === "Recommended"
      ? fixedRecommendation
        ? [
            {
              id: `echonx-${fixedRecommendation.slot}`,
              title: fixedRecommendation.title,
              author: fixedRecommendation.author ?? "EchonX",
              duration: "—",
              coverUrl: fixedRecommendation.coverUrl ?? MOCK_BOOKS[0].coverUrl,
              sourceUrl:
                fixedRecommendation.documentType === "text"
                  ? fixedRecommendation.documentUrl
                  : fixedRecommendation.documentUrl,
            },
            ...MOCK_BOOKS,
          ]
        : MOCK_BOOKS
      : GUTENBERG_BY_CATEGORY[activeTab];

  const showCatalog = !hasSearched;

  function cancelSearch() {
    setSearchOpen(false);
    setHasSearched(false);
    setQuery("");
    setSearchResults([]);
    setSearchMessage(null);
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    setSearchMessage(null);

    if (term.length < 3) {
      setSearchMessage("Type at least 3 characters.");
      return;
    }

    setHasSearched(true);
    setSearchResults([]);

    startSearchTransition(async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20_000);

      try {
        const response = await fetch(`/api/recommended-reading/search?q=${encodeURIComponent(term)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as { results?: SearchResultBook[]; error?: string };
        const remote = (data.results ?? []).map(
          (book): LibraryDisplayBook => ({
            id: book.id,
            title: book.title,
            author: book.author,
            duration: "—",
            coverUrl: book.coverUrl ?? "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
            sourceUrl: book.sourceUrl,
          }),
        );

        if (remote.length) {
          setSearchResults(remote);
          setSearchMessage(null);
        } else {
          setSearchResults([]);
          setSearchMessage(
            data.error ??
              "No playable public-domain match. Try the English title (e.g. Frankenstein, Pride and Prejudice).",
          );
        }
      } catch (err) {
        setSearchResults([]);
        setSearchMessage(
          err instanceof Error && err.name === "AbortError"
            ? "Search timed out. Try again or use a shorter title."
            : "Could not search public books right now.",
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    });
  }

  return (
    <div
      id="library"
      className={cn(
        audiopostCardClass(),
        audiopostCardPadding,
        "flex h-full min-h-0 flex-col overflow-hidden scroll-mt-4 max-lg:h-auto max-lg:min-h-[220px]",
      )}
    >
      <p className={cn(audiopostSectionLabelClass, "shrink-0 text-muted-foreground")}>Library</p>

      <div className="mt-2 flex shrink-0 gap-3 overflow-x-auto pb-0.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              if (!hasSearched) setActiveTab(tab);
            }}
            disabled={hasSearched}
            className={cn(
              "shrink-0 text-xs font-medium transition-colors",
              activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground",
              hasSearched && "cursor-not-allowed opacity-40",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x pb-1 pt-0.5 max-lg:touch-pan-x max-lg:overscroll-x-contain">
        {showCatalog ? (
          <div className="flex items-start gap-4">
            {catalogBooks.map((book) => {
              const source =
                book.id.startsWith("echonx-") && fixedRecommendation
                  ? echonxRecommendationToSource(fixedRecommendation)
                  : bookToSource(book);
              const selected = selectedSource?.id === source.id;
              return (
                <LibraryBookTile
                  key={book.id}
                  book={book}
                  selected={selected}
                  onSelect={() => setSelectedSource(source)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[140px] flex-col">
            {searchMessage ? <p className="mb-2 px-0.5 text-[10px] text-muted-foreground">{searchMessage}</p> : null}
            {isSearching && !searchResults.length ? (
              <div className="flex flex-1 items-center justify-center text-[10px] text-muted-foreground">
                Searching Project Gutenberg…
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {searchResults.map((book) => {
                  const source = bookToSource(book);
                  const selected = selectedSource?.id === source.id;
                  return (
                    <LibraryBookTile
                      key={book.id}
                      book={book}
                      selected={selected}
                      onSelect={() => setSelectedSource(source)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-white/[0.06] pt-2">
        {!searchOpen ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-muted-foreground transition-colors hover:border-primary/35 hover:bg-primary/10 hover:text-primary"
              aria-label="Search public books"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Public book title…"
                autoComplete="off"
                className="h-8 rounded-lg border-white/[0.1] bg-white/[0.03] pl-8 text-xs placeholder:text-muted-foreground/45"
              />
            </div>
            <Button type="submit" size="sm" disabled={isSearching} className="h-8 shrink-0 rounded-lg px-3 text-xs">
              {isSearching ? "…" : "Search"}
            </Button>
            <button
              type="button"
              onClick={cancelSearch}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
              aria-label="Cancel search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
