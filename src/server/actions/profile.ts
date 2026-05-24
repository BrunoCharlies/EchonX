"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { moderateImageWithEdgeOrFallback } from "@/lib/moderation-edge";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isAuthLinkedNativeProfile } from "@/lib/profiles/profile-kind";
import { repairAuthLinkedProfileKind } from "@/lib/profiles/repair-profile-kind";
import { normalizeHandle, pickUniqueUsername } from "@/lib/sync/twitter-to-supabase";

const usernameRegex = /^[a-z0-9_]{3,24}$/;
const urlRegex = /(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i;

type EditableProfileRow = {
  id: string;
  username: string;
  avatar_path: string | null;
  cover_path?: string | null;
};

function isMissingCoverPathColumn(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string" &&
    (error as { message: string }).message.toLowerCase().includes("cover_path")
  );
}

async function ensureNativeProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supabase = createServiceRoleClient();
  const uid = session.user.id;
  const { data: byId, error: byIdErr } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (byIdErr) throw byIdErr;
  if (byId) {
    const { kind } = await repairAuthLinkedProfileKind(supabase, byId, uid);
    return { ...byId, kind };
  }

  const { data: byOwner, error: byOwnerErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("owner_x_user_id", uid)
    .maybeSingle();
  if (byOwnerErr) throw byOwnerErr;
  if (byOwner) {
    const { kind } = await repairAuthLinkedProfileKind(supabase, byOwner, uid);
    return { ...byOwner, kind };
  }

  const desiredUsername = normalizeHandle(session.user.name ?? session.user.email?.split("@")[0] ?? uid);
  const username = await pickUniqueUsername(supabase, desiredUsername);
  const displayName = session.user.name ?? session.user.email?.split("@")[0] ?? "Listener";

  const { data: inserted, error: insertErr } = await supabase
    .from("profiles")
    .insert({
      id: uid,
      owner_x_user_id: uid,
      username,
      display_name: displayName,
      name: displayName,
      email: session.user.email ?? null,
      bio: null,
      avatar_path: null,
      kind: "native",
      role: session.user.role,
    })
    .select("*")
    .single();

  if (insertErr) throw insertErr;

  await supabase.from("subscriptions").upsert(
    {
      owner_x_user_id: uid,
      plan: "free",
    },
    { onConflict: "owner_x_user_id" },
  );

  return inserted;
}

export async function updateNativeProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar = formData.get("avatar");
  const cover = formData.get("cover");

  if (!usernameRegex.test(username)) {
    throw new Error("Usernames must be 3-24 characters: lowercase letters, numbers, or underscores.");
  }
  if (!displayName || displayName.length > 80) {
    throw new Error("Name must be between 1 and 80 characters.");
  }
  if (bio.length > 50) {
    throw new Error("Bio must be 50 characters or fewer.");
  }
  if (urlRegex.test(bio)) {
    throw new Error("Links are not allowed in the bio.");
  }

  const supabase = createServiceRoleClient();
  const uid = session.user.id;

  const { data: profileById, error: initialReadErr } = await supabase
    .from("profiles")
    .select("id,username,avatar_path,cover_path")
    .eq("id", uid)
    .maybeSingle();
  let readErr = initialReadErr;
  let profileByIdRow = profileById as EditableProfileRow | null;

  if (isMissingCoverPathColumn(readErr)) {
    const fallback = await supabase.from("profiles").select("id,username,avatar_path").eq("id", uid).maybeSingle();
    profileByIdRow = fallback.data as EditableProfileRow | null;
    readErr = fallback.error;
  }
  if (readErr) throw readErr;

  let profileByOwner: EditableProfileRow | null = null;
  let ownerReadErr = null;
  if (!profileByIdRow) {
    const ownerResult = await supabase
      .from("profiles")
      .select("id,username,avatar_path,cover_path")
      .eq("owner_x_user_id", uid)
      .maybeSingle();
    profileByOwner = ownerResult.data as EditableProfileRow | null;
    ownerReadErr = ownerResult.error;
    if (isMissingCoverPathColumn(ownerReadErr)) {
      const fallback = await supabase.from("profiles").select("id,username,avatar_path").eq("owner_x_user_id", uid).maybeSingle();
      profileByOwner = fallback.data as EditableProfileRow | null;
      ownerReadErr = fallback.error;
    }
  }

  if (ownerReadErr) throw ownerReadErr;
  const profile = profileByIdRow ?? profileByOwner;
  if (!profile) throw new Error("Profile not found");

  if (username !== profile.username) {
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken && taken.id !== profile.id) {
      throw new Error("That username is already taken.");
    }
  }

  let avatarUrl: string | null = profile.avatar_path;
  let coverUrl: string | null = "cover_path" in profile ? (profile.cover_path ?? null) : null;

  if (avatar instanceof File && avatar.size > 0) {
    const bytes = Buffer.from(await avatar.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error("Avatar exceeds 2 MB after compression.");
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, avatar.type || "image/webp");
    if (!moderation.ok) {
      throw new Error("Avatar did not pass automatic moderation.");
    }

    const path = `${uid}/avatar.webp`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = pub.publicUrl;
  }

  if (cover instanceof File && cover.size > 0) {
    const bytes = Buffer.from(await cover.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error("Cover image exceeds 2 MB after compression.");
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, cover.type || "image/webp");
    if (!moderation.ok) {
      throw new Error("Cover image did not pass automatic moderation.");
    }

    const path = `${uid}/cover.webp`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    coverUrl = pub.publicUrl;
  }

  const updatePayload = {
    username,
    display_name: displayName,
    name: displayName,
    bio: bio || null,
    avatar_path: avatarUrl,
    cover_path: coverUrl,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", profile.id);

  if (error && isMissingCoverPathColumn(error)) {
    const fallbackPayload = {
      username: updatePayload.username,
      display_name: updatePayload.display_name,
      name: updatePayload.name,
      bio: updatePayload.bio,
      avatar_path: updatePayload.avatar_path,
      updated_at: updatePayload.updated_at,
    };
    const fallback = await supabase.from("profiles").update(fallbackPayload).eq("id", profile.id);
    if (fallback.error) throw fallback.error;
  } else if (error) {
    throw error;
  }

  revalidatePath("/app/onboarding");
  revalidatePath("/profile");
  revalidatePath(`/u/${username}`);
}

export async function getMyProfile() {
  return ensureNativeProfile();
}
