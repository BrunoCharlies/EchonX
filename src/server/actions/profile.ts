"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { moderateImageWithEdgeOrFallback } from "@/lib/moderation-edge";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { repairAuthLinkedProfileKind } from "@/lib/profiles/repair-profile-kind";
import { formatUserFacingError } from "@/lib/errors/user-facing";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_MODERATION_MESSAGE,
  PROFILE_IMAGE_SIZE_MESSAGE,
  PROFILE_IMAGE_TYPE_MESSAGE,
  PROFILE_IMAGE_UPLOAD_MESSAGE,
} from "@/lib/uploads/profile-images";
import {
  isValidUsername,
  normalizeUsernameInput,
  USERNAME_VALIDATION_MESSAGE,
} from "@/lib/profiles/username";
import { normalizeHandle, pickUniqueUsername } from "@/lib/sync/twitter-to-supabase";
const urlRegex = /(https?:\/\/|www\.|[a-z0-9-]+\.[a-z]{2,})/i;

type EditableProfileRow = {
  id: string;
  username: string;
  avatar_path: string | null;
  cover_path?: string | null;
};

function isMissingColumn(error: unknown, column: string) {
  if (!error || typeof error !== "object" || !("message" in error)) return false;
  const message = String((error as { message?: unknown }).message).toLowerCase();
  const col = column.toLowerCase();
  return message.includes(col) && (message.includes("column") || message.includes("schema cache"));
}

function isMissingCoverPathColumn(error: unknown) {
  return isMissingColumn(error, "cover_path");
}

function throwProfileError(error: unknown, fallback: string): never {
  throw new Error(formatUserFacingError(error, fallback));
}

function assertProfileImageFile(file: File, label: string) {
  if (!isAllowedProfileImageFile(file)) {
    throw new Error(`${label}: ${PROFILE_IMAGE_TYPE_MESSAGE}`);
  }
}

async function ensureNativeProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supabase = createServiceRoleClient();
  const uid = session.user.id;
  const { data: byId, error: byIdErr } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  if (byIdErr) throwProfileError(byIdErr, "Could not load your profile.");
  if (byId) {
    const { kind } = await repairAuthLinkedProfileKind(supabase, byId, uid);
    return { ...byId, kind };
  }

  const { data: byOwner, error: byOwnerErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("owner_x_user_id", uid)
    .maybeSingle();
  if (byOwnerErr) throwProfileError(byOwnerErr, "Could not load your profile.");
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
      bio: null,
      avatar_path: null,
      kind: "native",
      role: session.user.role,
    })
    .select("*")
    .single();

  if (insertErr) throwProfileError(insertErr, "Could not create your profile.");

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

  const username = normalizeUsernameInput(String(formData.get("username") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar = formData.get("avatar");
  const cover = formData.get("cover");

  if (!isValidUsername(username)) {
    throw new Error(USERNAME_VALIDATION_MESSAGE);
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
  if (readErr) throwProfileError(readErr, "Could not load your profile.");

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

  if (ownerReadErr) throwProfileError(ownerReadErr, "Could not load your profile.");
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
    assertProfileImageFile(avatar, "Profile photo");
    const bytes = Buffer.from(await avatar.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error(`Profile photo: ${PROFILE_IMAGE_SIZE_MESSAGE}`);
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, avatar.type || "image/jpeg");
    if (!moderation.ok) {
      throw new Error(`Profile photo: ${PROFILE_IMAGE_MODERATION_MESSAGE}`);
    }

    const path = `${uid}/avatar.jpg`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throwProfileError(upErr, PROFILE_IMAGE_UPLOAD_MESSAGE);

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = pub.publicUrl;
  }

  if (cover instanceof File && cover.size > 0) {
    assertProfileImageFile(cover, "Profile cover");
    const bytes = Buffer.from(await cover.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error(`Profile cover: ${PROFILE_IMAGE_SIZE_MESSAGE}`);
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, cover.type || "image/jpeg");
    if (!moderation.ok) {
      throw new Error(`Profile cover: ${PROFILE_IMAGE_MODERATION_MESSAGE}`);
    }

    const path = `${uid}/cover.jpg`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upErr) throwProfileError(upErr, PROFILE_IMAGE_UPLOAD_MESSAGE);

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    coverUrl = pub.publicUrl;
  }

  const updatedAt = new Date().toISOString();
  const basePayload = {
    username,
    display_name: displayName,
    bio: bio || null,
    avatar_path: avatarUrl,
    updated_at: updatedAt,
  };

  const payloads: Record<string, unknown>[] = [
    { ...basePayload, name: displayName, cover_path: coverUrl },
    { ...basePayload, name: displayName },
    { ...basePayload, cover_path: coverUrl },
    basePayload,
  ];

  let lastError: unknown = null;
  for (const payload of payloads) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
    if (!error) {
      lastError = null;
      break;
    }
    lastError = error;
    const msg = formatUserFacingError(error, "");
    const skip =
      isMissingCoverPathColumn(error) ||
      isMissingColumn(error, "name") ||
      isMissingColumn(error, "cover_path");
    if (!skip && msg) break;
  }

  if (lastError) {
    throwProfileError(lastError, "Could not save your profile.");
  }

  await repairAuthLinkedProfileKind(supabase, { id: profile.id, kind: "native", owner_x_user_id: uid }, uid);

  revalidatePath("/app/onboarding");
  revalidatePath("/profile");
  revalidatePath(`/u/${username}`);
}

export async function getMyProfile() {
  return ensureNativeProfile();
}
