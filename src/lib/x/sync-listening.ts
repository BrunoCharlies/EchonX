import { isFreeOfficialFollowProfile } from "@/lib/curator/official-profiles";
import { enqueueListeningPostsIfEligible } from "@/lib/listening/queue-enqueue";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { buildMirroredXPostBody } from "@/lib/voice/post-announcement";
import { getLatestXPosts, type XPost, type XUser } from "@/lib/x/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const X_SYNC_ONLINE_WINDOW_MINUTES_DEFAULT = 30;

export type XListeningSyncSource =
  | "add_profile"
  | "background"
  | "active_audiopost"
  | "manual"
  | "admin_manual"
  | "cron_online";

export type SyncExternalListeningResult = {
  imported: number;
  profilesChecked: number;
  listenersTouched: number;
};

type ProfileRow = {
  id: string;
  owner_x_user_id: string | null;
  username: string | null;
  display_name: string | null;
  kind: string | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function getXStatusCode(error: unknown) {
  if (!(error instanceof Error)) return null;
  const match = error.message.match(/X API request failed \((\d+)\)/);
  return match ? Number(match[1]) : null;
}

async function logXApiUsageEvent(input: {
  listenerId: string | null;
  profileId?: string | null;
  xUserId?: string | null;
  endpoint: "users_by_username" | "user_tweets";
  source: XListeningSyncSource;
  intervalMs?: number;
  imported?: number;
  ok: boolean;
  error?: unknown;
}) {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("x_api_usage_events").insert({
      listener_x_user_id: input.listenerId,
      target_profile_id: input.profileId ?? null,
      x_user_id: input.xUserId ?? null,
      endpoint: input.endpoint,
      source: input.source,
      requested_interval_ms: input.intervalMs ?? null,
      imported_count: input.imported ?? 0,
      ok: input.ok,
      status_code: getXStatusCode(input.error),
      error_message: input.error ? getErrorMessage(input.error, "X API request failed.") : null,
    });
    if (error && error.code !== "PGRST205" && error.code !== "PGRST204") {
      console.warn("[x-api-usage] could not log usage event", error);
    }
  } catch (error) {
    console.warn("[x-api-usage] could not log usage event", error);
  }
}

function isMissingColumnError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === "PGRST204"
  );
}

async function importPostsAndQueueForListener(input: {
  supabase: SupabaseClient;
  listenerId: string;
  profileId: string;
  user: XUser;
  posts: XPost[];
}) {
  let imported = 0;
  const postIdsForQueue: string[] = [];

  for (const post of input.posts.reverse()) {
    const { data: existing, error: existingErr } = await input.supabase
      .from("posts")
      .select("id")
      .eq("external_source", "x")
      .eq("external_id", post.id)
      .maybeSingle();

    if (existingErr && !isMissingColumnError(existingErr)) throw existingErr;

    let postId = existing?.id as string | undefined;
    const announcement = buildMirroredXPostBody(
      input.user.name || `@${input.user.username}`,
      post.text,
    );

    if (!postId) {
      const baseInsert = {
        author_id: input.profileId,
        body: announcement,
        image_paths: [] as string[],
        moderation_payload: null,
        created_at: post.createdAt,
      };

      const { data: inserted, error } = await input.supabase
        .from("posts")
        .insert({
          ...baseInsert,
          external_source: "x",
          external_id: post.id,
        })
        .select("id")
        .single();

      if (error && isMissingColumnError(error)) {
        const fallback = await input.supabase.from("posts").insert(baseInsert).select("id").single();
        if (fallback.error) throw fallback.error;
        postId = fallback.data?.id as string | undefined;
      } else if (error) {
        throw error;
      } else {
        postId = inserted?.id as string | undefined;
      }
      if (postId) imported++;
    } else {
      const { error: bodyErr } = await input.supabase.from("posts").update({ body: announcement }).eq("id", postId);
      if (bodyErr && !isMissingColumnError(bodyErr)) throw bodyErr;
    }

    if (postId) postIdsForQueue.push(postId);
  }

  await enqueueListeningPostsIfEligible(input.supabase, {
    listenerId: input.listenerId,
    postIds: postIdsForQueue,
    reason: "x_realtime_import",
  });

  return imported;
}

/** Distinct external_x profiles in want_to_hear, optionally only if an online listener follows them. */
export async function listExternalXProfilesToSync(input: {
  supabase: SupabaseClient;
  onlineOnly?: boolean;
  onlineWindowMinutes?: number;
  /** Admin manual sync: include every external_x in want_to_hear (cron still skips official mirrors). */
  includeAllExternalX?: boolean;
}): Promise<Map<string, { profile: ProfileRow; listeners: Set<string> }>> {
  const { data: follows, error } = await input.supabase
    .from("want_to_hear")
    .select(
      "listener_x_user_id, target_profile_id, profiles!inner(id, owner_x_user_id, username, display_name, kind)",
    );

  if (error) throw error;

  const onlineCutoff =
    input.onlineOnly && input.onlineWindowMinutes
      ? new Date(Date.now() - input.onlineWindowMinutes * 60_000).toISOString()
      : null;

  const listenerIds = [...new Set((follows ?? []).map((f) => String(f.listener_x_user_id ?? "")).filter(Boolean))];
  const onlineListeners = new Set<string>();

  if (onlineCutoff && listenerIds.length) {
    const { data: listeners, error: listenerErr } = await input.supabase
      .from("profiles")
      .select("id, last_seen_at")
      .in("id", listenerIds);
    if (listenerErr) throw listenerErr;
    for (const row of listeners ?? []) {
      const id = String(row.id ?? "");
      const seen = row.last_seen_at as string | null;
      if (id && seen && seen >= onlineCutoff) onlineListeners.add(id);
    }
  }

  const byProfile = new Map<string, { profile: ProfileRow; listeners: Set<string> }>();

  for (const follow of follows ?? []) {
    const profileRaw = Array.isArray(follow.profiles) ? follow.profiles[0] : follow.profiles;
    const profileId = String(follow.target_profile_id ?? profileRaw?.id ?? "");
    const listenerId = String(follow.listener_x_user_id ?? "");
    if (!profileId || !listenerId || !profileRaw || profileRaw.kind !== "external_x") continue;

    if (onlineCutoff && !onlineListeners.has(listenerId)) continue;

    const profile: ProfileRow = {
      id: profileId,
      owner_x_user_id: profileRaw.owner_x_user_id ? String(profileRaw.owner_x_user_id) : null,
      username: profileRaw.username ? String(profileRaw.username) : null,
      display_name: profileRaw.display_name ? String(profileRaw.display_name) : null,
      kind: profileRaw.kind ? String(profileRaw.kind) : null,
    };

    if (!input.includeAllExternalX && isFreeOfficialFollowProfile(profile)) continue;

    const existing = byProfile.get(profileId);
    if (existing) {
      existing.listeners.add(listenerId);
    } else {
      byProfile.set(profileId, { profile, listeners: new Set([listenerId]) });
    }
  }

  return byProfile;
}

export async function syncExternalXListeningProfiles(input: {
  source: XListeningSyncSource;
  intervalMs?: number;
  listenerIdForLogs: string | null;
  onlineOnly?: boolean;
  onlineWindowMinutes?: number;
  includeAllExternalX?: boolean;
}): Promise<SyncExternalListeningResult> {
  const supabase = createServiceRoleClient();
  const byProfile = await listExternalXProfilesToSync({
    supabase,
    onlineOnly: input.onlineOnly,
    onlineWindowMinutes: input.onlineWindowMinutes ?? X_SYNC_ONLINE_WINDOW_MINUTES_DEFAULT,
    includeAllExternalX: input.includeAllExternalX,
  });

  let imported = 0;
  let profilesChecked = 0;
  const listenersTouched = new Set<string>();

  for (const { profile, listeners } of byProfile.values()) {
    const xId = String(profile.owner_x_user_id ?? "").replace(/^x:/, "");
    if (!xId) continue;
    profilesChecked++;

    const username = String(profile.username ?? "").replace(/^x_/, "");
    const user: XUser = {
      id: xId,
      username,
      name: String(profile.display_name ?? username),
      profileImageUrl: null,
    };

    let posts: XPost[];
    try {
      posts = await getLatestXPosts(xId, 10);
    } catch (error) {
      await logXApiUsageEvent({
        listenerId: input.listenerIdForLogs,
        profileId: profile.id,
        xUserId: xId,
        endpoint: "user_tweets",
        source: input.source,
        intervalMs: input.intervalMs,
        ok: false,
        error,
      });
      continue;
    }

    let profileImported = 0;
    for (const listenerId of listeners) {
      const listenerImported = await importPostsAndQueueForListener({
        supabase,
        listenerId,
        profileId: profile.id,
        user,
        posts: [...posts],
      });
      profileImported = Math.max(profileImported, listenerImported);
      listenersTouched.add(listenerId);
    }
    imported += profileImported;

    await logXApiUsageEvent({
      listenerId: input.listenerIdForLogs,
      profileId: profile.id,
      xUserId: xId,
      endpoint: "user_tweets",
      source: input.source,
      intervalMs: input.intervalMs,
      imported: profileImported,
      ok: true,
    });
  }

  return {
    imported,
    profilesChecked,
    listenersTouched: listenersTouched.size,
  };
}
