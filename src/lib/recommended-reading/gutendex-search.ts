import { flattenGutenbergCatalog } from "@/lib/audiopost/gutenberg-library";

export type GutendexBook = {
  id: number;
  title: string;
  authors?: Array<{ name?: string }>;
  copyright?: boolean | null;
  formats?: Record<string, string>;
};

export type GutendexResponse = {
  results?: GutendexBook[];
};

export type PublicBookResult = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  sourceUrl: string;
  score: number;
};

const NUMBER_ALIASES: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  "10": "ten",
  "50": "fifty",
  cinquenta: "fifty",
};

export function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|o|a|os|as|de|da|do|das|dos)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandQueryTokens(query: string) {
  const tokens = normalizeTitle(query).split(" ").filter((t) => t.length >= 2);
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    const alias = NUMBER_ALIASES[token];
    if (alias) expanded.add(alias);
  }
  return [...expanded];
}

function primaryTitle(value: string) {
  return normalizeTitle(value.split(/[;:]/)[0] ?? value);
}

function levenshtein(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      current[j] =
        a[i - 1] === b[j - 1]
          ? previous[j - 1]
          : Math.min(previous[j - 1] + 1, previous[j] + 1, current[j - 1] + 1);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length] ?? 0;
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshtein(a, b) / maxLength;
}

/** Relevance 0–1 between user query and catalog title (broader than exact match). */
export function scoreTitleMatch(query: string, title: string) {
  const normalizedQuery = normalizeTitle(query);
  const normalizedTitle = normalizeTitle(title);
  const normalizedPrimary = primaryTitle(title);

  if (!normalizedQuery || normalizedQuery.length < 3) return 0;
  if (normalizedTitle === normalizedQuery || normalizedPrimary === normalizedQuery) return 1;
  if (normalizedTitle.includes(normalizedQuery) || normalizedPrimary.includes(normalizedQuery)) return 0.92;
  if (normalizedQuery.includes(normalizedPrimary) && normalizedPrimary.length >= 4) return 0.88;

  const queryTokens = expandQueryTokens(query).filter((t) => t.length >= 2);
  const titleTokens = [...normalizedTitle.split(" "), ...normalizedPrimary.split(" ")].filter((t) => t.length >= 2);

  if (queryTokens.length) {
    let hits = 0;
    for (const qTok of queryTokens) {
      if (
        titleTokens.some((tTok) => {
          if (qTok.length >= 4 && tTok.length < 3) return false;
          return tTok.startsWith(qTok) || qTok.startsWith(tTok) || similarity(qTok, tTok) >= 0.8;
        })
      ) {
        hits++;
      }
    }
    const tokenScore = hits / queryTokens.length;
    if (tokenScore >= 0.5) return 0.55 + tokenScore * 0.4;
  }

  const fuzzy = Math.max(similarity(normalizedQuery, normalizedPrimary), similarity(normalizedQuery, normalizedTitle));
  if (normalizedQuery.length >= 6 && fuzzy >= 0.72) return fuzzy;
  if (normalizedQuery.length >= 4 && fuzzy >= 0.8) return fuzzy;

  return fuzzy >= 0.55 ? fuzzy * 0.7 : 0;
}

export function gutenbergCacheUrls(ebookId: number) {
  return {
    sourceUrl: `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.txt`,
    coverUrl: `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.cover.medium.jpg`,
  };
}

export function parseGutenbergEbookId(sourceUrl: string) {
  const match = sourceUrl.match(/\/epub\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

export function textFormat(formats?: Record<string, string>, ebookId?: number) {
  if (ebookId) return gutenbergCacheUrls(ebookId).sourceUrl;
  if (!formats) return null;
  const entries = Object.entries(formats);
  const plainText =
    entries.find(([type, url]) => type.startsWith("text/plain") && /\.txt/i.test(url)) ??
    entries.find(([type]) => type.startsWith("text/plain"));
  const url = plainText?.[1];
  if (!url) return null;
  const idFromUrl = url.match(/\/ebooks\/(\d+)/)?.[1];
  if (idFromUrl) return gutenbergCacheUrls(Number(idFromUrl)).sourceUrl;
  return url;
}

export function coverFormat(formats?: Record<string, string>) {
  if (!formats) return null;
  return Object.entries(formats).find(([type]) => type.startsWith("image/"))?.[1] ?? null;
}

const MIN_SCORE = 0.52;

export function mapGutendexResults(query: string, books: GutendexBook[], limit = 12): PublicBookResult[] {
  const results: PublicBookResult[] = [];
  for (const book of books) {
    if (book.copyright === true) continue;
    const sourceUrl = textFormat(book.formats, book.id);
    if (!sourceUrl) continue;
    const score = scoreTitleMatch(query, book.title);
    if (score < MIN_SCORE) continue;
    const { coverUrl } = gutenbergCacheUrls(book.id);
    results.push({
      id: `gutendex-${book.id}`,
      title: book.title.split(/[;:]/)[0]?.trim() || book.title,
      author: book.authors?.map((author) => author.name).filter(Boolean).join(", ") || "Public domain",
      coverUrl: coverFormat(book.formats) ?? coverUrl,
      sourceUrl,
      score,
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

const EXTRA_LOCAL_BOOKS: Array<{ title: string; author: string; ebookId: number }> = [
  { title: "Pride and Prejudice", author: "Jane Austen", ebookId: 1342 },
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", ebookId: 11 },
  { title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle", ebookId: 1661 },
  { title: "Moby-Dick", author: "Herman Melville", ebookId: 2701 },
  { title: "Dracula", author: "Bram Stoker", ebookId: 345 },
  { title: "A Tale of Two Cities", author: "Charles Dickens", ebookId: 98 },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", ebookId: 174 },
];

export function searchLocalPublicBooks(query: string, limit = 12): PublicBookResult[] {
  const entries = [
    ...flattenGutenbergCatalog().map((book) => {
      const ebookId = parseGutenbergEbookId(book.sourceUrl);
      return ebookId
        ? { title: book.title, author: book.author, ebookId, id: book.id }
        : null;
    }),
    ...EXTRA_LOCAL_BOOKS.map((book) => ({
      title: book.title,
      author: book.author,
      ebookId: book.ebookId,
      id: `local-${book.ebookId}`,
    })),
  ].filter((entry): entry is { title: string; author: string; ebookId: number; id: string } => Boolean(entry));

  const byEbookId = new Map<number, (typeof entries)[0]>();
  for (const entry of entries) {
    if (!byEbookId.has(entry.ebookId)) byEbookId.set(entry.ebookId, entry);
  }

  const results: PublicBookResult[] = [];
  for (const entry of byEbookId.values()) {
    const score = scoreTitleMatch(query, entry.title);
    if (score < MIN_SCORE) continue;
    const { sourceUrl, coverUrl } = gutenbergCacheUrls(entry.ebookId);
    results.push({
      id: entry.id.startsWith("pg-") ? entry.id : `gutendex-${entry.ebookId}`,
      title: entry.title,
      author: entry.author,
      coverUrl,
      sourceUrl,
      score,
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function mergePublicBookResults(local: PublicBookResult[], remote: PublicBookResult[], limit = 12) {
  const seen = new Set<number>();
  const merged: PublicBookResult[] = [];
  for (const book of [...local, ...remote].sort((a, b) => b.score - a.score)) {
    const ebookId = parseGutenbergEbookId(book.sourceUrl);
    if (ebookId !== null) {
      if (seen.has(ebookId)) continue;
      seen.add(ebookId);
    }
    merged.push(book);
    if (merged.length >= limit) break;
  }
  return merged;
}

export async function fetchGutendexSearch(query: string, timeoutMs = 10_000) {
  const response = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Gutendex returned ${response.status}`);
  }
  return (await response.json()) as GutendexResponse;
}
