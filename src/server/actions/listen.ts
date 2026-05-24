"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { assertCanFollowExternalXProfile } from "@/lib/billing/entitlements";
import { createServiceRoleClient } from "@/lib/supabase/service";

type ToggleWantToHearResult =
  | { ok: true; subscribed: boolean }
  | {
      ok: false;
      error: string;
      subscribed?: boolean;
      code?: "PLAN_LIMIT";
      upgradeUrl?: string;
    };

export type FollowedProfile = {
  id: string;
  username: string;
  displayName: string;
  kind: "native" | "external_x" | "curator";
  listeningSince: string | null;
};

export async function toggleWantToHear(targetProfileId: string | null | undefined): Promise<ToggleWantToHearResult> {
  const session = await auth();
  const profileId = typeof targetProfileId === "string" && targetProfileId.trim() ? targetProfileId.trim() : null;

  if (!session?.user?.id) return { ok: false, error: "Sign in to add this profile to your queue." };
  const listener = session.user.id;
  if (!profileId) return { ok: false, error: "Profile not found." };

  const supabase = createServiceRoleClient();

  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id, owner_x_user_id, username")
    .eq("id", profileId)
    .maybeSingle();

  if (targetErr) return { ok: false, error: targetErr.message };
  if (!target?.id) return { ok: false, error: "Profile not found." };
  if ((target.owner_x_user_id ?? null) === listener || target.id === listener) {
    return { ok: false, error: "You cannot subscribe to your own profile." };
  }

  const { data: existing, error: existingErr } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", listener)
    .eq("target_profile_id", profileId)
    .maybeSingle();

  if (existingErr) return { ok: false, error: existingErr.message };

  if (existing) {
    const { error } = await supabase
      .from("want_to_hear")
      .delete()
      .eq("listener_x_user_id", listener)
      .eq("target_profile_id", profileId);
    if (error) return { ok: false, error: error.message, subscribed: true };
    if (target.username) revalidatePath(`/u/${target.username}`);
    revalidatePath("/app");
    revalidatePath("/app/explore");
    return { ok: true, subscribed: false };
  } else {
    const planLimit = await assertCanFollowExternalXProfile({
      supabase,
      listenerXUserId: listener,
      targetProfileId: profileId,
      role: session.user.role,
    });
    if (planLimit) {
      return {
        ok: false,
        error: planLimit.message,
        subscribed: false,
        code: planLimit.code,
        upgradeUrl: planLimit.upgradeUrl,
      };
    }

    const listeningSince = new Date().toISOString();
    const { error } = await supabase.from("want_to_hear").insert({
      listener_x_user_id: listener,
      target_profile_id: profileId,
      listening_since: listeningSince,
    });
    if (error) return { ok: false, error: error.message, subscribed: false };

    // Only posts created after listening_since are auto-queued (DB trigger on posts INSERT).

    if (target.username) revalidatePath(`/u/${target.username}`);
    revalidatePath("/app");
    revalidatePath("/app/explore");
    return { ok: true, subscribed: true };
  }
}

export async function getViewerFollowedProfileIds(profileIds: string[]): Promise<Set<string>> {
  const session = await auth();
  const listener = session?.user?.id ?? null;
  if (!listener || !profileIds.length) return new Set();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", listener)
    .in("target_profile_id", profileIds);

  if (error) {
    console.error("[getViewerFollowedProfileIds]", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.target_profile_id as string));
}

export async function getFollowedProfiles(): Promise<FollowedProfile[]> {
  const session = await auth();
  const listener = session?.user?.id ?? null;
  if (!listener) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("want_to_hear")
    .select("target_profile_id, listening_since")
    .eq("listener_x_user_id", listener)
    .order("listening_since", { ascending: true });

  if (error) {
    if (error.code !== "PGRST205") console.error("[getFollowedProfiles] want_to_hear", error);
    return [];
  }

  const ids = (data ?? [])
    .map((row) => row.target_profile_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!ids.length) return [];

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, name, kind")
    .in("id", ids);

  if (profileErr) {
    console.error("[getFollowedProfiles] profiles", profileErr);
    return [];
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));

  return (data ?? [])
    .map((row) => {
      const profile = profileMap.get(row.target_profile_id as string);
      if (!profile?.id) return null;
      const username = String(profile.username ?? "profile");
      const displayName = String(profile.display_name ?? profile.name ?? username);
      return {
        id: String(profile.id),
        username,
        displayName,
        kind:
          profile.kind === "external_x" ? "external_x" : profile.kind === "curator" ? "curator" : "native",
        listeningSince: (row.listening_since as string | null) ?? null,
      };
    })
    .filter((profile): profile is FollowedProfile => profile !== null);
}

export async function unfollowProfile(targetProfileId: string | null | undefined): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  const listener = session?.user?.id ?? null;
  const profileId = typeof targetProfileId === "string" && targetProfileId.trim() ? targetProfileId.trim() : null;
  if (!listener) return { ok: false, error: "Sign in to edit followed profiles." };
  if (!profileId) return { ok: false, error: "Profile not found." };

  const supabase = createServiceRoleClient();

  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();
  if (targetErr) return { ok: false, error: targetErr.message };

  const { error } = await supabase
    .from("want_to_hear")
    .delete()
    .eq("listener_x_user_id", listener)
    .eq("target_profile_id", profileId);
  if (error) return { ok: false, error: error.message };

  const { data: posts } = await supabase.from("posts").select("id").eq("author_id", profileId);
  const postIds = (posts ?? [])
    .map((post) => post.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (postIds.length) {
    let queueDelete = await supabase
      .from("listening_queue")
      .delete()
      .eq("listener_x_user_id", listener)
      .in("post_id", postIds)
      .is("consumed_at", null);

    if (queueDelete.error?.code === "PGRST204") {
      queueDelete = await supabase
        .from("listening_queue")
        .delete()
        .eq("listener_x_user_id", listener)
        .in("post_id", postIds);
    }
    if (queueDelete.error && queueDelete.error.code !== "PGRST205") {
      return { ok: false, error: queueDelete.error.message };
    }
  }

  if (target?.username) revalidatePath(`/u/${target.username}`);
  revalidatePath("/app");
  revalidatePath("/app/explore");
  return { ok: true };
}
