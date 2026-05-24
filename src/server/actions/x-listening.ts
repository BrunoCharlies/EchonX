"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  assertCanFollowExternalXProfile,
  billingUpgradeUrl,
  canAddCustomExternalXAccountsForUser,
  loadUserEntitlement,
} from "@/lib/billing/entitlements";
import { enqueueListeningPostsIfEligible } from "@/lib/listening/queue-enqueue";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isReservedQubicXHandle } from "@/lib/curator/official-profiles";
import { ensureQubicOfficialChannel, getQubicOfficialChannelState } from "@/lib/curator/qubic-ingest";
import { syncExternalXListeningProfiles } from "@/lib/x/sync-listening";
import { getLatestXPosts, getXUserByUsername, sanitizeXHandle, type XPost, type XUser } from "@/lib/x/client";
import { isExternalOwnerKey } from "@/lib/profiles/profile-kind";
import { buildMirroredXPostBody } from "@/lib/voice/post-announcement";

type ActionResult =
  | { ok: true; message: string; imported: number; profilePath: string }
  | { ok: false; error: string; code?: "PLAN_LIMIT"; upgradeUrl?: string };

type SyncSource = "add_profile" | "background" | "active_audiopost" | "manual" | "admin_manual";

type SyncOptions = {
  source?: SyncSource;
  intervalMs?: number;
};

function profileUsernameForX(handle: string) {
  return `x_${handle}`.slice(0, 24);
}

function postAnnouncement(user: XUser, post: XPost) {
  return buildMirroredXPostBody(user.name || `@${user.username}`, post.text);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown; code?: unknown; details?: unknown };
    const message = typeof maybe.message === "string" ? maybe.message : "";
    const code = typeof maybe.code === "string" ? ` (${maybe.code})` : "";
    const details = typeof maybe.details === "string" && maybe.details ? ` Details: ${maybe.details}` : "";
    if (
      maybe.code === "23503" &&
      message.includes("profiles") &&
      message.includes("profiles_id_fkey")
    ) {
      return "Your Supabase schema still links every profile to auth.users. Apply migration 00009_allow_external_profiles_without_auth_user.sql, then try again.";
    }
    if (message) return `${message}${code}${details}`;
  }
  return fallback;
}

function isMissingColumnError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === "PGRST204"
  );
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
  source: SyncSource;
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

async function ensureExternalXProfile(user: XUser) {
  const supabase = createServiceRoleClient();
  const owner = `x:${user.id}`;
  const fallbackOwner = `x:${user.username.toLowerCase()}`;
  const username = profileUsernameForX(user.username.toLowerCase());

  const { data: existingByOwner, error: ownerReadErr } = await supabase
    .from("profiles")
    .select("id, username")
    .in("owner_x_user_id", [owner, fallbackOwner])
    .maybeSingle();

  if (ownerReadErr) throw ownerReadErr;

  const { data: existingByUsername, error: usernameReadErr } = existingByOwner
    ? { data: null, error: null }
    : await supabase.from("profiles").select("id, username").eq("username", username).maybeSingle();

  if (usernameReadErr) throw usernameReadErr;

  const existing = existingByOwner ?? existingByUsername;
  if (existing?.id) {
    const { data: existingFull, error: existingFullErr } = await supabase
      .from("profiles")
      .select("id, username, owner_x_user_id, kind")
      .eq("id", existing.id)
      .maybeSingle();
    if (existingFullErr) throw existingFullErr;

    const ownerKey = (existingFull?.owner_x_user_id as string | null) ?? null;
    if (existingFull && !isExternalOwnerKey(ownerKey)) {
      // Do not relabel a native/auth profile as external_x — keep a separate X mirror row.
    } else {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          owner_x_user_id: owner,
          username: existing.username ?? username,
          display_name: user.name,
          avatar_path: user.profileImageUrl,
          kind: "external_x",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateErr) throw updateErr;
      return { id: existing.id as string, username: (existing.username as string | null) ?? username };
    }
  }

  const { data: inserted, error } = await supabase
    .from("profiles")
    .insert({
      id: randomUUID(),
      owner_x_user_id: owner,
      username,
      display_name: user.name,
      bio: null,
      avatar_path: user.profileImageUrl,
      kind: "external_x",
      role: "user",
    })
    .select("id, username")
    .single();

  if (error || !inserted?.id) throw error ?? new Error("Could not create external X profile.");
  return { id: inserted.id as string, username: (inserted.username as string | null) ?? username };
}

async function importPostsAndQueueForListener(input: { listenerId: string; profileId: string; user: XUser; posts: XPost[] }) {
  const supabase = createServiceRoleClient();
  let imported = 0;
  const postIdsForQueue: string[] = [];

  for (const post of input.posts.reverse()) {
    const { data: existing, error: existingErr } = await supabase
      .from("posts")
      .select("id")
      .eq("external_source", "x")
      .eq("external_id", post.id)
      .maybeSingle();

    if (existingErr && !isMissingColumnError(existingErr)) throw existingErr;

    let postId = existing?.id as string | undefined;
    const announcement = postAnnouncement(input.user, post);

    if (!postId) {
      const baseInsert = {
        author_id: input.profileId,
        body: announcement,
        image_paths: [] as string[],
        moderation_payload: null,
        created_at: post.createdAt,
      };

      const { data: inserted, error } = await supabase
        .from("posts")
        .insert({
          ...baseInsert,
          external_source: "x",
          external_id: post.id,
          external_url: `https://x.com/${input.user.username}/status/${post.id}`,
        })
        .select("id")
        .single();

      if (error && isMissingColumnError(error)) {
        const fallback = await supabase.from("posts").insert(baseInsert).select("id").single();
        if (fallback.error) throw fallback.error;
        postId = fallback.data?.id as string | undefined;
      } else {
        if (error) throw error;
        postId = inserted?.id as string | undefined;
      }
      imported++;
    } else {
      const { error: bodyErr } = await supabase.from("posts").update({ body: announcement }).eq("id", postId);
      if (bodyErr && !isMissingColumnError(bodyErr)) throw bodyErr;
    }

    if (postId) postIdsForQueue.push(postId);
  }

  await enqueueListeningPostsIfEligible(supabase, {
    listenerId: input.listenerId,
    postIds: postIdsForQueue,
    reason: "x_realtime_import",
  });

  return imported;
}

export async function addXProfileToListening(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sign in before adding X profiles." };
  const listenerId = session.user.id;
  const userRole = session.user.role;

  const handle = sanitizeXHandle(String(formData.get("handle") ?? ""));
  if (!handle) return { ok: false, error: "Enter a valid X @username." };

  if (!isReservedQubicXHandle(handle)) {
    const supabase = createServiceRoleClient();
    const entitlement = await loadUserEntitlement(supabase, listenerId);
    if (!canAddCustomExternalXAccountsForUser(entitlement.effectivePlan, userRole)) {
      return {
        ok: false,
        error:
          "Free includes official @qubic on X and unlimited native EchonX profiles. Upgrade to Starter to add other X accounts.",
        code: "PLAN_LIMIT",
        upgradeUrl: billingUpgradeUrl("starter", "x_profile"),
      };
    }
  }

  if (isReservedQubicXHandle(handle)) {
    await ensureQubicOfficialChannel();
    const channel = await getQubicOfficialChannelState();
    const supabase = createServiceRoleClient();
    const { error: followErr } = await supabase.from("want_to_hear").upsert(
      {
        listener_x_user_id: listenerId,
        target_profile_id: channel.profileId,
        listening_since: new Date().toISOString(),
      },
      { onConflict: "listener_x_user_id,target_profile_id" },
    );
    if (followErr) throw followErr;
    revalidatePath("/app");
    revalidatePath(`/u/${channel.username}`);
    revalidatePath("/app/explore");
    return {
      ok: true,
      imported: 0,
      profilePath: `/u/${channel.username}`,
      message: `Qubic is an official free channel on EchonX. Follow @${channel.username} — new X posts appear in Explore and your queue after you follow.`,
    };
  }

  try {
    let user: XUser;
    try {
      user = await getXUserByUsername(handle);
      await logXApiUsageEvent({
        listenerId,
        xUserId: null,
        endpoint: "users_by_username",
        source: "add_profile",
        ok: true,
      });
    } catch (error) {
      await logXApiUsageEvent({
        listenerId,
        xUserId: null,
        endpoint: "users_by_username",
        source: "add_profile",
        ok: false,
        error,
      });
      throw error;
    }
    const profile = await ensureExternalXProfile(user);
    const supabase = createServiceRoleClient();

    const planLimit = await assertCanFollowExternalXProfile({
      supabase,
      listenerXUserId: listenerId,
      targetProfileId: profile.id,
      role: userRole,
    });
    if (planLimit) {
      return {
        ok: false,
        error: planLimit.message,
        code: planLimit.code,
        upgradeUrl: planLimit.upgradeUrl,
      };
    }

    const { error: followErr } = await supabase.from("want_to_hear").upsert(
      {
        listener_x_user_id: listenerId,
        target_profile_id: profile.id,
        listening_since: new Date().toISOString(),
      },
      { onConflict: "listener_x_user_id,target_profile_id" },
    );
    if (followErr) throw followErr;

    let posts: XPost[];
    try {
      posts = await getLatestXPosts(user.id, 10);
    } catch (error) {
      await logXApiUsageEvent({
        listenerId,
        profileId: profile.id,
        xUserId: user.id,
        endpoint: "user_tweets",
        source: "add_profile",
        ok: false,
        error,
      });
      throw error;
    }
    const imported = await importPostsAndQueueForListener({ listenerId, profileId: profile.id, user, posts });
    await logXApiUsageEvent({
      listenerId,
      profileId: profile.id,
      xUserId: user.id,
      endpoint: "user_tweets",
      source: "add_profile",
      imported,
      ok: true,
    });

    revalidatePath("/app");
    revalidatePath(`/u/${profile.username}`);

    return {
      ok: true,
      imported,
      profilePath: `/u/${profile.username}`,
      message: imported
        ? `Added @${user.username} and queued ${imported} recent post${imported === 1 ? "" : "s"}.`
        : `Added @${user.username}. No new posts found right now.`,
    };
  } catch (error) {
    console.error("[addXProfileToListening]", error);
    return { ok: false, error: getErrorMessage(error, "Could not add this X profile.") };
  }
}

export async function syncMyXListeningQueue(options: SyncOptions = {}): Promise<ActionResult> {
  const session = await auth();
  const listenerId = session?.user?.id ?? null;
  if (!listenerId) return { ok: false, error: "Sign in before syncing." };

  const supabase = createServiceRoleClient();
  const { data: follows, error } = await supabase
    .from("want_to_hear")
    .select("target_profile_id, profiles!inner(id, owner_x_user_id, username, display_name, kind)")
    .eq("listener_x_user_id", listenerId);

  if (error) return { ok: false, error: error.message };

  const source = options.source ?? "manual";
  let imported = 0;
  for (const follow of follows ?? []) {
    const profile = Array.isArray(follow.profiles) ? follow.profiles[0] : follow.profiles;
    if (!profile || profile.kind !== "external_x") continue;
    const xId = String(profile.owner_x_user_id ?? "").replace(/^x:/, "");
    if (!xId) continue;
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
        listenerId,
        profileId: String(profile.id),
        xUserId: xId,
        endpoint: "user_tweets",
        source,
        intervalMs: options.intervalMs,
        ok: false,
        error,
      });
      continue;
    }
    const profileImported = await importPostsAndQueueForListener({ listenerId, profileId: String(profile.id), user, posts });
    imported += profileImported;
    await logXApiUsageEvent({
      listenerId,
      profileId: String(profile.id),
      xUserId: xId,
      endpoint: "user_tweets",
      source,
      intervalMs: options.intervalMs,
      imported: profileImported,
      ok: true,
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/explore");
  return {
    ok: true,
    imported,
    profilePath: "/app",
    message: imported ? `Queued ${imported} new X post${imported === 1 ? "" : "s"}.` : "No new X posts found.",
  };
}

export async function syncAllXListeningQueuesForAdmin(options: SyncOptions = {}): Promise<
  | {
      ok: true;
      message: string;
      imported: number;
      queued: number;
      profilesChecked: number;
      listenersUpdated: number;
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized." };
  if (session.user.role !== "admin") return { ok: false, error: "Forbidden." };

  try {
    const result = await syncExternalXListeningProfiles({
      source: "admin_manual",
      intervalMs: options.intervalMs,
      listenerIdForLogs: session.user.id,
      onlineOnly: false,
      includeAllExternalX: true,
    });

    revalidatePath("/app");
    revalidatePath("/app/explore");
    revalidatePath("/admin");

    return {
      ok: true,
      imported: result.imported,
      queued: result.imported,
      profilesChecked: result.profilesChecked,
      listenersUpdated: result.listenersTouched,
      message: `Checked ${result.profilesChecked} X profile${result.profilesChecked === 1 ? "" : "s"} and imported ${result.imported} new post${
        result.imported === 1 ? "" : "s"
      }.`,
    };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Admin X sync failed.") };
  }
}
