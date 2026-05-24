"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { BookOpen, ChevronRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PdfReadingSource } from "@/components/app/pdf-reading-player";
import { librarySourceProxyUrl } from "@/lib/library/library-source-url";
import type { RecommendedReadingItem } from "@/server/actions/recommended-reading";
import { cn } from "@/lib/utils";

type LibraryBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  sourceUrl: string;
};

type SearchResponse = {
  results?: LibraryBook[];
  error?: string;
};

const PUBLIC_BOOKS: LibraryBook[] = [
  {
    id: "gutenberg-pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    coverUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/1342/pg1342.txt",
  },
  {
    id: "gutenberg-alice",
    title: "Alice in Wonderland",
    author: "Lewis Carroll",
    coverUrl: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/11/pg11.txt",
  },
  {
    id: "gutenberg-frankenstein",
    title: "Frankenstein",
    author: "Mary Shelley",
    coverUrl: "https://www.gutenberg.org/cache/epub/84/pg84.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/84/pg84.txt",
  },
  {
    id: "gutenberg-sherlock",
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    coverUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/1661/pg1661.txt",
  },
  {
    id: "gutenberg-moby-dick",
    title: "Moby-Dick",
    author: "Herman Melville",
    coverUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/2701/pg2701.txt",
  },
  {
    id: "gutenberg-dracula",
    title: "Dracula",
    author: "Bram Stoker",
    coverUrl: "https://www.gutenberg.org/cache/epub/345/pg345.cover.medium.jpg",
    sourceUrl: "https://www.gutenberg.org/cache/epub/345/pg345.txt",
  },
];

function fixedToSource(item: RecommendedReadingItem): PdfReadingSource {
  return {
    id: `echonx-${item.slot}-${item.updatedAt ?? "current"}`,
    title: item.title,
    author: item.author,
    sourceType: item.documentType,
    sourceUrl: librarySourceProxyUrl(item.documentUrl),
  };
}

function bookToSource(book: LibraryBook): PdfReadingSource {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    sourceType: "text",
    sourceUrl: librarySourceProxyUrl(book.sourceUrl),
  };
}

export function RecommendedReadingLibrary({
  fixedRecommendation,
  selectedSourceId,
  onSelect,
}: {
  fixedRecommendation: RecommendedReadingItem | null;
  selectedSourceId?: string | null;
  onSelect: (source: PdfReadingSource) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LibraryBook[]>([]);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const localMatches = useMemo(() => {
    const term = query.trim();
    if (term.length < 3) return [];
    const q = term.toLowerCase();
    return PUBLIC_BOOKS.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        q.split(/\s+/).every((part) => part.length < 2 || book.title.toLowerCase().includes(part)),
    );
  }, [query]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    setSearchMessage(null);

    if (term.length < 3) {
      setSearchResults([]);
      setSearchMessage("Digite pelo menos 3 caracteres.");
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    if (localMatches.length) {
      setSearchResults(localMatches);
    }

    startSearchTransition(async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

      try {
        const response = await fetch(`/api/recommended-reading/search?q=${encodeURIComponent(term)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as SearchResponse;
        if (!response.ok) {
          throw new Error(data.error ?? "Não foi possível buscar livros públicos.");
        }
        const remote = data.results ?? [];
        if (remote.length) {
          setSearchResults(remote);
          setSearchMessage(null);
        } else if (localMatches.length) {
          setSearchResults(localMatches);
          setSearchMessage("Nenhum resultado extra no catálogo público; mostrando correspondências locais.");
        } else {
          setSearchResults([]);
          setSearchMessage(
            "Nenhum livro legível no domínio público para este título. Obras recentes com copyright (ex.: Cinquenta tons) não estão no Project Gutenberg.",
          );
        }
      } catch (err) {
        if (localMatches.length) {
          setSearchResults(localMatches);
          setSearchMessage("Busca online lenta ou indisponível; mostrando correspondências locais.");
        } else {
          setSearchResults([]);
          setSearchMessage(
            err instanceof Error && err.name === "AbortError"
              ? "A busca demorou demais. Tente de novo ou use o título em inglês."
              : err instanceof Error
                ? err.message
                : "Não foi possível buscar livros públicos.",
          );
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    });
  }

  function clearSearch() {
    setQuery("");
    setSearchResults([]);
    setSearchMessage(null);
    setHasSearched(false);
  }

  const showingSearch = hasSearched || searchResults.length > 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Biblioteca recomendada</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Selecione uma leitura para ouvir em áudio.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 gap-1 px-2 text-xs">
          Ver mais
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <form className="mb-3 flex flex-col gap-2 sm:flex-row" onSubmit={onSearch}>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search public book title"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-10" disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
          {showingSearch ? (
            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={clearSearch}>
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      {searchMessage ? <p className="mb-3 text-xs text-muted-foreground">{searchMessage}</p> : null}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {isSearching && !searchResults.length ? (
          <div className="flex min-h-[180px] min-w-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/40 px-4 text-center text-xs text-muted-foreground">
            Buscando no catálogo público (Project Gutenberg)…
          </div>
        ) : null}
        {searchResults.length ? (
          searchResults.map((book) => {
            const source = bookToSource(book);
            return (
              <ReadingCard
                key={book.id}
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                badge="Public"
                selected={selectedSourceId === source.id}
                onSelect={() => onSelect(source)}
              />
            );
          })
        ) : !hasSearched ? (
          <>
            {fixedRecommendation ? (
              <ReadingCard
                title={fixedRecommendation.title}
                author={fixedRecommendation.author ?? "EchonX"}
                coverUrl={fixedRecommendation.coverUrl}
                badge="EchonX pick"
                selected={selectedSourceId === fixedToSource(fixedRecommendation).id}
                onSelect={() => onSelect(fixedToSource(fixedRecommendation))}
              />
            ) : (
              <div className="flex min-w-[130px] max-w-[130px] flex-col justify-between rounded-lg border border-dashed border-primary/30 bg-background/50 p-2">
                <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-secondary/60 text-center text-[11px] text-muted-foreground">
                  EchonX pick coming soon
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-medium">Recommendation empty</p>
                <p className="text-[11px] text-muted-foreground">Admin can add one</p>
              </div>
            )}

            {PUBLIC_BOOKS.map((book) => {
              const source = bookToSource(book);
              return (
                <ReadingCard
                  key={book.id}
                  title={book.title}
                  author={book.author}
                  coverUrl={book.coverUrl}
                  selected={selectedSourceId === source.id}
                  onSelect={() => onSelect(source)}
                />
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ReadingCard({
  title,
  author,
  coverUrl,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  author: string;
  coverUrl?: string | null;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "group min-w-[130px] max-w-[130px] rounded-lg border bg-background/65 p-2 transition-colors",
        selected ? "border-primary shadow-lg shadow-primary/15" : "border-border/70 hover:border-primary/40",
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-secondary">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
            No cover
          </div>
        )}
        {badge ? (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            <Sparkles className="h-2.5 w-2.5" />
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 min-h-8 text-xs font-medium">{title}</p>
      <p className="line-clamp-1 text-[11px] text-muted-foreground">{author}</p>
      <Button type="button" variant={selected ? "default" : "outline"} size="sm" className="mt-2 h-7 w-full text-[11px]" onClick={onSelect}>
        {selected ? "Selected" : "Selecionar"}
      </Button>
    </div>
  );
}
