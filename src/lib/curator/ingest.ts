import "server-only";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  DEFAULT_NEWS_BIO,
  DEFAULT_NEWS_DISPLAY_NAME,
  CURATOR_EXTERNAL_SOURCES,
  NEWS_CURATOR_EXTERNAL_SOURCE,
  NEWS_OFFICIAL_CHANNEL_SLOT,
  NEWS_OFFICIAL_OWNER_KEY,
  NEWS_OFFICIAL_USERNAME,
} from "@/lib/curator/constants";
import { buildCuratorPostImagePaths } from "@/lib/curator/card-image";
import { buildCuratorPostBody } from "@/lib/curator/post-body";
import { fetchRssFeed } from "@/lib/curator/rss";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type OfficialChannelState = {
  slot: string;
  profileId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarPath: string | null;
  active: boolean;
  ingestIntervalMinutes: number;
  maxPostsPerRun: number;
  updatedAt: string | null;
  sources: Array<{
    id: string;
    label: string;
    feedUrl: string;
    active: boolean;
    lastFetchedAt: string | null;
  }>;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  kind: string | null;
};

function externalIdForItem(guid: string, link: string) {
  const seed = guid.trim() || link.trim();
  return createHash("sha256").update(seed).digest("hex").slice(0, 40);
}

export async function ensureNewsOfficialChannel(): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: channelRow } = await supabase
    .from("official_channels")
    .select("slot, profile_id, active, ingest_interval_minutes, max_posts_per_run, updated_at")
    .eq("slot", NEWS_OFFICIAL_CHANNEL_SLOT)
    .maybeSingle();

  let profile: ProfileRow | null = null;

  if (channelRow?.profile_id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_path, kind")
      .eq("id", channelRow.profile_id)
      .maybeSingle();
    profile = data as ProfileRow | null;
  }

  if (!profile) {
    const { data: byUsername } = await supabase
      .from("profiles")
      .select("id, username, display_name, bio, avatar_path, kind")
      .eq("username", NEWS_OFFICIAL_USERNAME)
      .maybeSingle();
    profile = byUsername as ProfileRow | null;
  }

  if (!profile) {
    const profileId = crypto.randomUUID();
    const { data: inserted, error } = await supabase
      .from("profiles")
      .insert({
        id: profileId,
        owner_x_user_id: NEWS_OFFICIAL_OWNER_KEY,
        username: NEWS_OFFICIAL_USERNAME,
        display_name: DEFAULT_NEWS_DISPLAY_NAME,
        name: DEFAULT_NEWS_DISPLAY_NAME,
        bio: DEFAULT_NEWS_BIO,
        kind: "curator",
        role: "user",
      })
      .select("id, username, display_name, bio, avatar_path, kind")
      .single();

    if (error) throw error;
    profile = inserted as ProfileRow;
  } else if (profile.kind !== "curator") {
    await supabase
      .from("profiles")
      .update({
        kind: "curator",
        display_name: profile.display_name ?? DEFAULT_NEWS_DISPLAY_NAME,
        bio: profile.bio ?? DEFAULT_NEWS_BIO,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    profile.kind = "curator";
  }

  if (!channelRow) {
    const { error } = await supabase.from("official_channels").insert({
      slot: NEWS_OFFICIAL_CHANNEL_SLOT,
      profile_id: profile.id,
      active: true,
      ingest_interval_minutes: 120,
      max_posts_per_run: 3,
    });
    if (error) throw error;
  }

  return profile.id;
}

export async function getNewsOfficialChannelState(): Promise<OfficialChannelState> {
  const profileId = await ensureNewsOfficialChannel();
  const supabase = createServiceRoleClient();

  const { data: channelRow, error: channelErr } = await supabase
    .from("official_channels")
    .select("slot, profile_id, active, ingest_interval_minutes, max_posts_per_run, updated_at")
    .eq("slot", NEWS_OFFICIAL_CHANNEL_SLOT)
    .single();
  if (channelErr) throw channelErr;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path")
    .eq("id", profileId)
    .single();
  if (profileErr || !profile) throw profileErr ?? new Error("Official profile missing.");

  const { data: sources } = await supabase
    .from("curator_feed_sources")
    .select("id, label, feed_url, active, last_fetched_at")
    .eq("channel_slot", NEWS_OFFICIAL_CHANNEL_SLOT)
    .order("label", { ascending: true });

  return {
    slot: channelRow.slot as string,
    profileId: profile.id as string,
    username: profile.username as string,
    displayName: (profile.display_name as string | null) ?? DEFAULT_NEWS_DISPLAY_NAME,
    bio: (profile.bio as string | null) ?? null,
    avatarPath: (profile.avatar_path as string | null) ?? null,
    active: Boolean(channelRow.active),
    ingestIntervalMinutes: Number(channelRow.ingest_interval_minutes ?? 120),
    maxPostsPerRun: Number(channelRow.max_posts_per_run ?? 3),
    updatedAt: (channelRow.updated_at as string | null) ?? null,
    sources: (sources ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      feedUrl: row.feed_url as string,
      active: Boolean(row.active),
      lastFetchedAt: (row.last_fetched_at as string | null) ?? null,
    })),
  };
}

export async function runNewsCuratorIngest(options?: { maxPosts?: number }) {
  const supabase = createServiceRoleClient();
  const channel = await getNewsOfficialChannelState();

  if (!channel.active) {
    return { ok: true as const, created: 0, skipped: 0, message: "News channel is paused." };
  }

  const maxPosts = Math.min(options?.maxPosts ?? channel.maxPostsPerRun, 10);
  const { data: sources, error: sourcesErr } = await supabase
    .from("curator_feed_sources")
    .select("id, label, feed_url, active")
    .eq("channel_slot", NEWS_OFFICIAL_CHANNEL_SLOT)
    .eq("active", true);

  if (sourcesErr) throw sourcesErr;
  if (!sources?.length) {
    return { ok: true as const, created: 0, skipped: 0, message: "No active RSS sources configured." };
  }

  let created = 0;
  let skipped = 0;

  for (const source of sources) {
    if (created >= maxPosts) break;

    const feedUrl = String(source.feed_url);
    let items;
    try {
      items = await fetchRssFeed(feedUrl, 15);
    } catch (error) {
      console.warn("[curator-ingest] feed failed", feedUrl, error);
      continue;
    }

    await supabase
      .from("curator_feed_sources")
      .update({ last_fetched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", source.id);

    for (const item of items) {
      if (created >= maxPosts) break;

      const externalId = externalIdForItem(item.guid, item.link);
      const { data: existing } = await supabase
        .from("posts")
        .select("id")
        .in("external_source", [...CURATOR_EXTERNAL_SOURCES])
        .eq("external_id", externalId)
        .maybeSingle();

      if (existing?.id) {
        skipped++;
        continue;
      }

      const body = buildCuratorPostBody({
        title: item.title,
        summary: item.summary,
        link: item.link,
      });

      const imagePaths = buildCuratorPostImagePaths({
        externalId,
        title: item.title,
        sourceLabel: source.label,
        rssImageUrl: item.imageUrl,
        allowRssHotlink: process.env.CURATOR_RSS_IMAGE_HOTLINK !== "false",
      });

      const { error: insertErr } = await supabase.from("posts").insert({
        author_id: channel.profileId,
        body,
        image_paths: imagePaths,
        moderation_payload: {
          sourceLabel: source.label,
          feedUrl,
          publishedAt: item.publishedAt,
          cardAccent: imagePaths[imagePaths.length - 1],
        },
        external_source: NEWS_CURATOR_EXTERNAL_SOURCE,
        external_id: externalId,
        external_url: item.link,
      });

      if (insertErr) {
        console.warn("[curator-ingest] post insert failed", insertErr.message);
        skipped++;
        continue;
      }

      created++;
    }
  }

  revalidatePath("/app/explore");
  revalidatePath(`/u/${channel.username}`);
  revalidatePath("/admin");

  return {
    ok: true as const,
    created,
    skipped,
    message:
      created > 0
        ? `Published ${created} new post${created === 1 ? "" : "s"} on @${channel.username}.`
        : "No new headlines to publish right now.",
  };
}
