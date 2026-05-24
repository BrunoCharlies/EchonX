export type RssItem = {
  guid: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string | null;
  imageUrl: string | null;
};

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function stripHtml(html: string) {
  return decodeXmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ? decodeXmlEntities(match[1]) : "";
}

function readAtomLink(block: string) {
  const match = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  return match?.[1] ? decodeXmlEntities(match[1]) : "";
}

function readAttrUrl(tag: string) {
  const match = tag.match(/\burl=["']([^"']+)["']/i);
  return match?.[1] ? decodeXmlEntities(match[1]) : "";
}

/** First HTTPS image in the item block (enclosure, media, or inline img). */
export function extractRssItemImageUrl(block: string): string | null {
  const enclosure = block.match(/<enclosure[^>]*>/i);
  if (enclosure) {
    const url = readAttrUrl(enclosure[0]);
    if (url?.startsWith("https://")) return url;
  }

  const mediaTags = block.match(/<media:(?:content|thumbnail|group)[^>]*>/gi) ?? [];
  for (const tag of mediaTags) {
    const url = readAttrUrl(tag);
    if (url?.startsWith("https://")) return url;
  }

  const img = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img?.[1]?.startsWith("https://")) return decodeXmlEntities(img[1]);

  return null;
}

export function parseRssFeed(xml: string, limit = 20): RssItem[] {
  const items: RssItem[] = [];
  const rssBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of rssBlocks.slice(0, limit)) {
    const title = readTag(block, "title");
    const link = readTag(block, "link") || readAtomLink(block);
    const guid = readTag(block, "guid") || link || title;
    const summary = stripHtml(readTag(block, "description") || readTag(block, "content:encoded") || readTag(block, "summary"));
    const pubDate = readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated");
    if (!title || !link) continue;
    items.push({
      guid,
      title,
      link,
      summary,
      publishedAt: pubDate || null,
      imageUrl: extractRssItemImageUrl(block),
    });
  }

  if (items.length) return items;

  const atomBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of atomBlocks.slice(0, limit)) {
    const title = readTag(block, "title");
    const link = readAtomLink(block) || readTag(block, "link");
    const guid = readTag(block, "id") || link || title;
    const summary = stripHtml(readTag(block, "summary") || readTag(block, "content"));
    const pubDate = readTag(block, "published") || readTag(block, "updated");
    if (!title || !link) continue;
    items.push({
      guid,
      title,
      link,
      summary,
      publishedAt: pubDate || null,
      imageUrl: extractRssItemImageUrl(block),
    });
  }

  return items;
}

export async function fetchRssFeed(feedUrl: string, limit = 20) {
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Feed request failed (${response.status})`);
  }
  const xml = await response.text();
  return parseRssFeed(xml, limit);
}
