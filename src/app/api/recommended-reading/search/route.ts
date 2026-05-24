import { NextResponse } from "next/server";
import {
  fetchGutendexSearch,
  mapGutendexResults,
  mergePublicBookResults,
  searchLocalPublicBooks,
  type PublicBookResult,
} from "@/lib/recommended-reading/gutendex-search";

export const dynamic = "force-dynamic";

async function fetchRemoteCatalog(query: string): Promise<PublicBookResult[]> {
  try {
    const data = await fetchGutendexSearch(query, 6_000);
    return mapGutendexResults(query, data.results ?? [], 16);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") ?? "").trim();

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  const local = searchLocalPublicBooks(query, 12);
  const gutendexBudgetMs = local.length > 0 ? 2_500 : 8_000;

  const remote = await Promise.race([
    fetchRemoteCatalog(query),
    new Promise<PublicBookResult[]>((resolve) => {
      setTimeout(() => resolve([]), gutendexBudgetMs);
    }),
  ]);

  const results = mergePublicBookResults(local, remote, 12);
  return NextResponse.json({ results });
}
