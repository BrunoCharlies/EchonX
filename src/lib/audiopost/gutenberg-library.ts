/** Public-domain titles from Project Gutenberg — one unique ebook per category tab. */

export type GutenbergLibraryBook = {
  id: string;
  title: string;
  author: string;
  duration: string;
  coverUrl: string;
  sourceUrl: string;
};

export const LIBRARY_TABS = [
  "Recommended",
  "Economy",
  "Technology",
  "Business",
  "Philosophy",
  "Crypto",
] as const;

export type LibraryTab = (typeof LIBRARY_TABS)[number];

export type CategoryTab = Exclude<LibraryTab, "Recommended">;

function pg(
  ebookId: number,
  title: string,
  author: string,
  duration: string,
  category: CategoryTab,
): GutenbergLibraryBook {
  return {
    id: `pg-${ebookId}-${category}`,
    title,
    author,
    duration,
    coverUrl: `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.cover.medium.jpg`,
    sourceUrl: `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.txt`,
  };
}

/** 30 unique ebooks (6 × 5 categories). Recommended tab uses separate mock list. */
export const GUTENBERG_BY_CATEGORY: Record<CategoryTab, GutenbergLibraryBook[]> = {
  Economy: [
    pg(3300, "Wealth of Nations", "Adam Smith", "18h 40m", "Economy"),
    pg(61, "The Communist Manifesto", "Karl Marx", "1h 20m", "Economy"),
    pg(243, "Economic Consequences of the Peace", "J. M. Keynes", "5h 10m", "Economy"),
    pg(10676, "Economic Sophisms", "Frédéric Bastiat", "4h 05m", "Economy"),
    pg(5740, "Fiat Money Inflation in France", "A. D. White", "2h 45m", "Economy"),
    pg(18, "The Federalist Papers", "Hamilton et al.", "6h 30m", "Economy"),
  ],
  Technology: [
    pg(201, "Flatland", "Edwin A. Abbott", "3h 05m", "Technology"),
    pg(35, "The Time Machine", "H. G. Wells", "2h 50m", "Technology"),
    pg(36, "The War of the Worlds", "H. G. Wells", "4h 15m", "Technology"),
    pg(84, "Frankenstein", "Mary Shelley", "5h 20m", "Technology"),
    pg(11224, "Twenty Thousand Leagues Under the Sea", "Jules Verne", "9h 55m", "Technology"),
    pg(4157, "The Autobiography of Benjamin Franklin", "B. Franklin", "6h 10m", "Technology"),
  ],
  Business: [
    pg(1232, "The Prince", "Niccolò Machiavelli", "3h 40m", "Business"),
    pg(10381, "The Art of War", "Sun Tzu", "2h 30m", "Business"),
    pg(13529, "The Science of Getting Rich", "Wallace D. Wattles", "2h 05m", "Business"),
    pg(1837, "The Art of Public Speaking", "Dale Carnegie", "5h 50m", "Business"),
    pg(16317, "Acres of Diamonds", "Russell H. Conwell", "1h 45m", "Business"),
    pg(205, "Walden", "Henry D. Thoreau", "6h 25m", "Business"),
  ],
  Philosophy: [
    pg(2680, "Meditations", "Marcus Aurelius", "3h 15m", "Philosophy"),
    pg(150, "The Republic", "Plato", "8h 40m", "Philosophy"),
    pg(5827, "The Problems of Philosophy", "Bertrand Russell", "2h 55m", "Philosophy"),
    pg(4363, "Beyond Good and Evil", "Friedrich Nietzsche", "4h 30m", "Philosophy"),
    pg(1998, "Thus Spake Zarathustra", "Friedrich Nietzsche", "6h 05m", "Philosophy"),
    pg(3675, "Leviathan", "Thomas Hobbes", "7h 20m", "Philosophy"),
  ],
  Crypto: [
    pg(1139, "Lombard Street", "Walter Bagehot", "4h 35m", "Crypto"),
    pg(7306, "Extraordinary Popular Delusions", "Charles Mackay", "7h 10m", "Crypto"),
    pg(15387, "Money and Trade Considered", "John Law", "2h 20m", "Crypto"),
    pg(38379, "The ABC of the Federal Reserve", "E. W. Kemmerer", "3h 50m", "Crypto"),
    pg(7363, "The Art of Money Getting", "P. T. Barnum", "2h 40m", "Crypto"),
    pg(32032, "The Conquest of Bread", "Peter Kropotkin", "5h 15m", "Crypto"),
  ],
};

/** Unique playable entries for local fuzzy search (deduped by ebook id). */
export function flattenGutenbergCatalog(): GutenbergLibraryBook[] {
  const byEbookId = new Map<number, GutenbergLibraryBook>();
  for (const books of Object.values(GUTENBERG_BY_CATEGORY)) {
    for (const book of books) {
      const match = book.id.match(/^pg-(\d+)-/);
      if (!match) continue;
      const ebookId = Number(match[1]);
      if (!byEbookId.has(ebookId)) byEbookId.set(ebookId, book);
    }
  }
  return [...byEbookId.values()];
}
