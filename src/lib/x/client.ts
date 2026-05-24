import { getXBearerToken } from "@/lib/env";

export type XUser = {
  id: string;
  username: string;
  name: string;
  profileImageUrl: string | null;
};

export type XMediaItem = {
  url: string;
  width?: number;
  height?: number;
};

export type XPost = {
  id: string;
  text: string;
  createdAt: string;
  /** Photo / preview URLs from X (only populated when includeMedia is true). */
  mediaUrls?: string[];
  /** Media with optional dimensions from the X API. */
  media?: XMediaItem[];
};

function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
}

async function xFetch<T>(path: string): Promise<T> {
  const token = getXBearerToken();
  if (!token) {
    throw new Error("Missing X_BEARER_TOKEN (or TWITTER_BEARER_TOKEN) in environment.");
  }

  const res = await fetch(`https://api.twitter.com/2${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`X API request failed (${res.status}): ${body || res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function getXUserByUsername(rawHandle: string): Promise<XUser> {
  const username = normalizeHandle(rawHandle);
  if (!username) throw new Error("Enter a valid X username.");

  const json = await xFetch<{
    data?: { id: string; username: string; name?: string; profile_image_url?: string };
  }>(`/users/by/username/${encodeURIComponent(username)}?user.fields=profile_image_url`);

  if (!json.data?.id) throw new Error(`Could not find @${username} on X.`);

  return {
    id: json.data.id,
    username: json.data.username,
    name: json.data.name || json.data.username,
    profileImageUrl: json.data.profile_image_url ?? null,
  };
}

type XMediaInclude = {
  media_key?: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
};

function mediaItemFromXMedia(media: XMediaInclude): XMediaItem | null {
  const type = media.type ?? "";
  if ((type === "photo" || type === "animated_gif") && media.url) {
    return { url: media.url, width: media.width, height: media.height };
  }
  if ((type === "video" || type === "animated_gif") && media.preview_image_url) {
    return {
      url: media.preview_image_url,
      width: media.width,
      height: media.height,
    };
  }
  return null;
}

function mediaForTweet(
  tweet: { attachments?: { media_keys?: string[] } },
  mediaByKey: Map<string, XMediaInclude>,
): XMediaItem[] {
  const keys = tweet.attachments?.media_keys ?? [];
  const items: XMediaItem[] = [];
  for (const key of keys) {
    const media = mediaByKey.get(key);
    if (!media) continue;
    const item = mediaItemFromXMedia(media);
    if (item) items.push(item);
  }
  return items;
}

function mapTweetsWithMedia(
  data: Array<{
    id: string;
    text?: string;
    created_at?: string;
    attachments?: { media_keys?: string[] };
  }>,
  mediaByKey: Map<string, XMediaInclude>,
): XPost[] {
  return data
    .filter((tweet) => tweet.id && (tweet.text ?? "").trim())
    .map((tweet) => {
      const media = mediaForTweet(tweet, mediaByKey);
      return {
        id: tweet.id,
        text: tweet.text ?? "",
        createdAt: tweet.created_at ?? new Date().toISOString(),
        media,
        mediaUrls: media.map((item) => item.url),
      };
    });
}

/** Lookup tweets by id (up to 100) with media — used for Qubic image backfill. */
export async function getXPostsByIds(tweetIds: string[]): Promise<XPost[]> {
  const ids = [...new Set(tweetIds.filter(Boolean))].slice(0, 100);
  if (!ids.length) return [];

  const json = await xFetch<{
    data?: Array<{
      id: string;
      text?: string;
      created_at?: string;
      attachments?: { media_keys?: string[] };
    }>;
    includes?: { media?: XMediaInclude[] };
  }>(
    `/tweets?ids=${ids.map((id) => encodeURIComponent(id)).join(",")}` +
      `&tweet.fields=created_at,attachments,text` +
      `&expansions=attachments.media_keys` +
      `&media.fields=url,preview_image_url,type,width,height`,
  );

  const mediaByKey = new Map(
    (json.includes?.media ?? [])
      .filter((m) => m.media_key)
      .map((m) => [m.media_key as string, m]),
  );

  return mapTweetsWithMedia(json.data ?? [], mediaByKey);
}

export async function getLatestXPosts(
  userId: string,
  maxResults = 10,
  options?: { includeMedia?: boolean },
): Promise<XPost[]> {
  const limit = Math.min(Math.max(maxResults, 5), 20);

  if (!options?.includeMedia) {
    const json = await xFetch<{
      data?: Array<{ id: string; text?: string; created_at?: string }>;
    }>(
      `/users/${encodeURIComponent(userId)}/tweets?max_results=${limit}&tweet.fields=created_at&exclude=retweets,replies`,
    );

    return (json.data ?? [])
      .filter((tweet) => tweet.id && (tweet.text ?? "").trim())
      .map((tweet) => ({
        id: tweet.id,
        text: tweet.text ?? "",
        createdAt: tweet.created_at ?? new Date().toISOString(),
      }));
  }

  const json = await xFetch<{
    data?: Array<{
      id: string;
      text?: string;
      created_at?: string;
      attachments?: { media_keys?: string[] };
    }>;
    includes?: { media?: XMediaInclude[] };
  }>(
    `/users/${encodeURIComponent(userId)}/tweets?max_results=${limit}` +
      `&tweet.fields=created_at,attachments` +
      `&expansions=attachments.media_keys` +
      `&media.fields=url,preview_image_url,type,width,height` +
      `&exclude=retweets,replies`,
  );

  const mediaByKey = new Map(
    (json.includes?.media ?? [])
      .filter((m) => m.media_key)
      .map((m) => [m.media_key as string, m]),
  );

  return mapTweetsWithMedia(json.data ?? [], mediaByKey);
}

export function sanitizeXHandle(raw: string) {
  return normalizeHandle(raw);
}
