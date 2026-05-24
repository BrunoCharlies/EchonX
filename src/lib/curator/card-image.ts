import "server-only";

import { getAppOrigin } from "@/lib/env";

/** On-demand card image (no Supabase storage). Unique per headline + source. */
export function buildCuratorCardImageUrl(input: {
  externalId: string;
  title: string;
  sourceLabel: string;
}) {
  const origin = getAppOrigin().replace(/\/$/, "");
  const params = new URLSearchParams({
    e: input.externalId.slice(0, 40),
    t: input.title.slice(0, 140),
    s: input.sourceLabel.slice(0, 48),
  });
  return `${origin}/api/curator/card?${params.toString()}`;
}

export function isAllowedRemoteCuratorImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local")) return false;
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(parsed.pathname) || parsed.pathname.includes("/image");
  } catch {
    return false;
  }
}

/**
 * Curator posts: prefer RSS hotlink when present (0 bytes on our storage),
 * always include generated card as fallback/visual identity.
 */
export function buildCuratorPostImagePaths(input: {
  externalId: string;
  title: string;
  sourceLabel: string;
  rssImageUrl?: string | null;
  /** When false, only the generated card URL is used (minimum footprint). */
  allowRssHotlink?: boolean;
}): string[] {
  const card = buildCuratorCardImageUrl({
    externalId: input.externalId,
    title: input.title,
    sourceLabel: input.sourceLabel,
  });

  if (input.allowRssHotlink !== false && input.rssImageUrl && isAllowedRemoteCuratorImageUrl(input.rssImageUrl)) {
    return [input.rssImageUrl, card];
  }

  return [card];
}
