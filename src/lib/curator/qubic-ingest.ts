import "server-only";

import { revalidatePath } from "next/cache";
import {
  DEFAULT_QUBIC_BIO,
  DEFAULT_QUBIC_DISPLAY_NAME,
  QUBIC_OFFICIAL_CHANNEL_SLOT,
  QUBIC_OFFICIAL_OWNER_KEY,
  QUBIC_OFFICIAL_USERNAME,
  QUBIC_X_HANDLE_DISPLAY,
  QUBIC_X_MIRROR_EXTERNAL_SOURCE,
  QUBIC_X_USERNAME,
} from "@/lib/curator/constants";
import { buildCuratorPostImagePaths } from "@/lib/curator/card-image";
import { buildQubicMirrorPostBody } from "@/lib/curator/qubic-post-body";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getLatestXPosts, getXPostsByIds, getXUserByUsername } from "@/lib/x/client";
import {
  importQubicXPostImages,
  postHasQubicXImportedImages,
  postNeedsQubicXImageBackfill,
  qubicPostImagePaths,
  stripCuratorCardsFromImagePaths,
} from "@/lib/curator/qubic-x-images";

export type QubicChannelState = {
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
  xHandleDisplay: string;
  xUsername: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  kind: string | null;
};

export async function ensureQubicOfficialChannel(): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: channelRow } = await supabase
    .from("official_channels")
    .select("slot, profile_id")
    .eq("slot", QUBIC_OFFICIAL_CHANNEL_SLOT)
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
      .eq("username", QUBIC_OFFICIAL_USERNAME)
      .maybeSingle();
    profile = byUsername as ProfileRow | null;
  }

  if (!profile) {
    const profileId = crypto.randomUUID();
    const { data: inserted, error } = await supabase
      .from("profiles")
      .insert({
        id: profileId,
        owner_x_user_id: QUBIC_OFFICIAL_OWNER_KEY,
        username: QUBIC_OFFICIAL_USERNAME,
        display_name: DEFAULT_QUBIC_DISPLAY_NAME,
        name: DEFAULT_QUBIC_DISPLAY_NAME,
        bio: DEFAULT_QUBIC_BIO,
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
        owner_x_user_id: QUBIC_OFFICIAL_OWNER_KEY,
        display_name: profile.display_name ?? DEFAULT_QUBIC_DISPLAY_NAME,
        bio: profile.bio ?? DEFAULT_QUBIC_BIO,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    profile.kind = "curator";
  }

  if (!channelRow) {
    const { error } = await supabase.from("official_channels").insert({
      slot: QUBIC_OFFICIAL_CHANNEL_SLOT,
      profile_id: profile.id,
      active: true,
      ingest_interval_minutes: 30,
      max_posts_per_run: 5,
    });
    if (error) throw error;
  }

  return profile.id;
}

export async function getQubicOfficialChannelState(): Promise<QubicChannelState> {
  const profileId = await ensureQubicOfficialChannel();
  const supabase = createServiceRoleClient();

  const { data: channelRow, error: channelErr } = await supabase
    .from("official_channels")
    .select("slot, profile_id, active, ingest_interval_minutes, max_posts_per_run, updated_at")
    .eq("slot", QUBIC_OFFICIAL_CHANNEL_SLOT)
    .single();
  if (channelErr) throw channelErr;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path")
    .eq("id", profileId)
    .single();
  if (profileErr || !profile) throw profileErr ?? new Error("Qubic official profile missing.");

  return {
    slot: channelRow.slot as string,
    profileId: profile.id as string,
    username: profile.username as string,
    displayName: (profile.display_name as string | null) ?? DEFAULT_QUBIC_DISPLAY_NAME,
    bio: (profile.bio as string | null) ?? null,
    avatarPath: (profile.avatar_path as string | null) ?? null,
    active: Boolean(channelRow.active),
    ingestIntervalMinutes: Number(channelRow.ingest_interval_minutes ?? 30),
    maxPostsPerRun: Number(channelRow.max_posts_per_run ?? 5),
    updatedAt: (channelRow.updated_at as string | null) ?? null,
    xHandleDisplay: QUBIC_X_HANDLE_DISPLAY,
    xUsername: QUBIC_X_USERNAME,
  };
}

export async function runQubicOfficialXIngest(options?: { maxPosts?: number }) {
  const supabase = createServiceRoleClient();
  const channel = await getQubicOfficialChannelState();

  if (!channel.active) {
    return { ok: true as const, created: 0, skipped: 0, message: "Qubic channel is paused." };
  }

  const maxPosts = Math.min(options?.maxPosts ?? channel.maxPostsPerRun, 10);

  let xUser;
  try {
    xUser = await getXUserByUsername(QUBIC_X_USERNAME);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach X API.";
    return { ok: false as const, created: 0, skipped: 0, error: message };
  }

  if (xUser.profileImageUrl) {
    await supabase
      .from("profiles")
      .update({
        display_name: xUser.name || DEFAULT_QUBIC_DISPLAY_NAME,
        name: xUser.name || DEFAULT_QUBIC_DISPLAY_NAME,
        avatar_path: xUser.profileImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", channel.profileId);
  }

  let posts;
  try {
    posts = await getLatestXPosts(xUser.id, Math.max(maxPosts, 5), { includeMedia: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch tweets.";
    return { ok: false as const, created: 0, skipped: 0, error: message };
  }

  let created = 0;
  let skipped = 0;

  for (const post of [...posts].reverse()) {
    if (created >= maxPosts) break;

    const externalId = post.id;
    const statusUrl = `https://x.com/${xUser.username}/status/${post.id}`;

    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("external_source", QUBIC_X_MIRROR_EXTERNAL_SOURCE)
      .eq("external_id", externalId)
      .maybeSingle();

    if (existing?.id) {
      skipped++;
      continue;
    }

    const body = buildQubicMirrorPostBody({
      text: post.text,
      xUsername: xUser.username,
      statusUrl,
    });

    const postId = crypto.randomUUID();

    const xImagePaths =
      post.mediaUrls?.length ?
        await importQubicXPostImages({
          supabase,
          postId,
          mediaUrls: post.mediaUrls,
        })
      : [];

    const imagePaths = qubicPostImagePaths(
      xImagePaths,
      buildCuratorPostImagePaths({
        externalId,
        title: post.text.slice(0, 120) || "Qubic on X",
        sourceLabel: "Qubic",
        allowRssHotlink: false,
      }),
    );

    const { error: insertErr } = await supabase.from("posts").insert({
      id: postId,
      author_id: channel.profileId,
      body,
      image_paths: imagePaths,
      moderation_payload: {
        xTweetId: post.id,
        xUsername: xUser.username,
        mirroredAt: new Date().toISOString(),
        xMediaImported: xImagePaths.length,
        xMediaSourceUrls: post.mediaUrls?.slice(0, 4) ?? [],
        xImageDimensions: (post.media ?? [])
          .filter((item) => item.width && item.height)
          .map((item) => ({ width: item.width as number, height: item.height as number })),
      },
      external_source: QUBIC_X_MIRROR_EXTERNAL_SOURCE,
      external_id: externalId,
      external_url: statusUrl,
      created_at: post.createdAt,
    });

    if (insertErr) {
      console.warn("[qubic-ingest] post insert failed", insertErr.message);
      skipped++;
      continue;
    }

    created++;
  }

  await supabase
    .from("official_channels")
    .update({ updated_at: new Date().toISOString() })
    .eq("slot", QUBIC_OFFICIAL_CHANNEL_SLOT);

  revalidatePath("/app/explore");
  revalidatePath(`/u/${channel.username}`);
  revalidatePath("/admin");

  return {
    ok: true as const,
    created,
    skipped,
    message:
      created > 0
        ? `Published ${created} new post${created === 1 ? "" : "s"} from ${QUBIC_X_HANDLE_DISPLAY} on @${channel.username}.`
        : `No new posts from ${QUBIC_X_HANDLE_DISPLAY} right now.`,
  };
}

/** Remove OG cards from Qubic posts that already have imported X photos. */
export async function stripQubicOgCardsFromImportedPosts(options?: { limit?: number }) {
  const supabase = createServiceRoleClient();
  const channel = await getQubicOfficialChannelState();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 80);

  const { data: rows, error: listErr } = await supabase
    .from("posts")
    .select("id, image_paths")
    .eq("author_id", channel.profileId)
    .eq("external_source", QUBIC_X_MIRROR_EXTERNAL_SOURCE)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (listErr) {
    return { ok: false as const, error: listErr.message, cardsRemoved: 0 };
  }

  let cardsRemoved = 0;

  for (const row of rows ?? []) {
    const paths = row.image_paths as string[] | null;
    if (!postHasQubicXImportedImages(paths)) continue;

    const withoutCards = stripCuratorCardsFromImagePaths(paths);
    if (withoutCards.length === (paths?.length ?? 0) || !withoutCards.length) continue;

    const { error: updErr } = await supabase
      .from("posts")
      .update({ image_paths: withoutCards })
      .eq("id", row.id as string);

    if (updErr) {
      console.warn("[qubic-strip-cards] update failed", updErr.message);
      continue;
    }
    cardsRemoved++;
  }

  if (cardsRemoved > 0) {
    revalidatePath("/app/explore");
    revalidatePath(`/u/${channel.username}`);
    revalidatePath("/admin");
  }

  return { ok: true as const, cardsRemoved };
}

/** Second pass: attach X photos to existing Qubic mirror posts that only have the OG card. */
export async function backfillQubicXPostImages(options?: { limit?: number }) {
  const supabase = createServiceRoleClient();
  const channel = await getQubicOfficialChannelState();
  const limit = Math.min(Math.max(options?.limit ?? 25, 1), 50);

  const { data: rows, error: listErr } = await supabase
    .from("posts")
    .select("id, external_id, image_paths, body, moderation_payload")
    .eq("author_id", channel.profileId)
    .eq("external_source", QUBIC_X_MIRROR_EXTERNAL_SOURCE)
    .not("external_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (listErr) {
    return { ok: false as const, error: listErr.message, updated: 0, skipped: 0, noMedia: 0 };
  }

  const candidates = (rows ?? [])
    .filter((row) => typeof row.external_id === "string" && row.external_id.length > 0)
    .filter((row) => postNeedsQubicXImageBackfill(row.image_paths as string[] | null))
    .slice(0, limit);

  if (!candidates.length) {
    return {
      ok: true as const,
      updated: 0,
      skipped: 0,
      noMedia: 0,
      message: "No Qubic posts need image backfill.",
    };
  }

  let tweetsById: Map<string, Awaited<ReturnType<typeof getXPostsByIds>>[number]>;
  try {
    const tweets = await getXPostsByIds(candidates.map((row) => row.external_id as string));
    tweetsById = new Map(tweets.map((tweet) => [tweet.id, tweet]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch tweets from X.";
    return { ok: false as const, error: message, updated: 0, skipped: 0, noMedia: 0 };
  }

  let updated = 0;
  let skipped = 0;
  let noMedia = 0;

  for (const row of candidates) {
    const tweetId = row.external_id as string;
    const tweet = tweetsById.get(tweetId);
    if (!tweet?.mediaUrls?.length) {
      noMedia++;
      continue;
    }

    const xImagePaths = await importQubicXPostImages({
      supabase,
      postId: row.id as string,
      mediaUrls: tweet.mediaUrls,
    });

    if (!xImagePaths.length) {
      skipped++;
      continue;
    }

    const payload = (row.moderation_payload as Record<string, unknown> | null) ?? {};
    const { error: updErr } = await supabase
      .from("posts")
      .update({
        image_paths: xImagePaths,
        moderation_payload: {
          ...payload,
          xMediaBackfilledAt: new Date().toISOString(),
          xMediaImported: xImagePaths.length,
          xMediaSourceUrls: tweet.mediaUrls.slice(0, 4),
          xImageDimensions: (tweet.media ?? [])
            .filter((item) => item.width && item.height)
            .map((item) => ({ width: item.width as number, height: item.height as number })),
        },
      })
      .eq("id", row.id as string);

    if (updErr) {
      console.warn("[qubic-backfill] update failed", updErr.message);
      skipped++;
      continue;
    }

    updated++;
  }

  const stripResult = await stripQubicOgCardsFromImportedPosts({ limit: 80 });
  const cardsRemoved = stripResult.ok ? stripResult.cardsRemoved : 0;

  revalidatePath("/app/explore");
  revalidatePath(`/u/${channel.username}`);
  revalidatePath("/admin");

  const stripNote =
    cardsRemoved > 0 ? ` Removed OG cards from ${cardsRemoved} post${cardsRemoved === 1 ? "" : "s"} that already had X photos.` : "";

  return {
    ok: true as const,
    updated,
    skipped,
    noMedia,
    cardsRemoved,
    message:
      updated > 0
        ? `Added X photos to ${updated} existing post${updated === 1 ? "" : "s"} on @${channel.username}.${stripNote}`
        : `Checked ${candidates.length} post${candidates.length === 1 ? "" : "s"}; none received importable media (${noMedia} without media on X, ${skipped} failed moderation/upload).${stripNote}`,
  };
}
