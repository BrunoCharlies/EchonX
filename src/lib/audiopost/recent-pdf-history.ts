export type RecentPdfEntry = {
  id: string;
  name: string;
  addedAt: number;
};

const STORAGE_KEY = "echonx:recent-pdf-uploads-v1";
const MAX_ENTRIES = 12;

export function loadRecentPdfs(): RecentPdfEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPdfEntry[];
    return Array.isArray(parsed) ? parsed.filter((e) => e?.id && e?.name) : [];
  } catch {
    return [];
  }
}

export function saveRecentPdfs(entries: RecentPdfEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function addRecentPdf(file: File): RecentPdfEntry[] {
  const entry: RecentPdfEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: file.name,
    addedAt: Date.now(),
  };
  const next = [entry, ...loadRecentPdfs().filter((e) => e.name !== file.name)].slice(0, MAX_ENTRIES);
  saveRecentPdfs(next);
  return next;
}

export function removeRecentPdf(id: string): RecentPdfEntry[] {
  const next = loadRecentPdfs().filter((e) => e.id !== id);
  saveRecentPdfs(next);
  return next;
}

export function clearRecentPdfs(): RecentPdfEntry[] {
  saveRecentPdfs([]);
  return [];
}

export function formatPdfAgo(addedAt: number) {
  const ms = Date.now() - addedAt;
  if (ms < 60_000) return "Just now";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return "Yesterday";
}
