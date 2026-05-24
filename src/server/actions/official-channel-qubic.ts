"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  QUBIC_OFFICIAL_CHANNEL_SLOT,
  QUBIC_OFFICIAL_USERNAME,
} from "@/lib/curator/constants";
import {
  backfillQubicXPostImages,
  getQubicOfficialChannelState,
  runQubicOfficialXIngest,
  type QubicChannelState,
} from "@/lib/curator/qubic-ingest";
import { createServiceRoleClient } from "@/lib/supabase/service";

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

async function assertAdmin() {
  const session = await auth();
  if (session?.user.role !== "admin") throw new Error("Only admins can manage the Qubic channel.");
  return session;
}

export async function getOfficialQubicChannel(): Promise<QubicChannelState> {
  return getQubicOfficialChannelState();
}

export async function saveOfficialQubicChannelProfile(formData: FormData) {
  await assertAdmin();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? QUBIC_OFFICIAL_USERNAME)
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const bio = String(formData.get("bio") ?? "").trim();
  const active = formData.get("active") === "on";
  const avatar = formData.get("avatar");

  if (!displayName) return { ok: false as const, error: "Display name is required." };
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return { ok: false as const, error: "Username must be 3–32 characters (letters, numbers, underscore)." };
  }

  const channel = await getQubicOfficialChannelState();
  const supabase = createServiceRoleClient();

  if (username !== channel.username) {
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken && taken.id !== channel.profileId) {
      return { ok: false as const, error: "That username is already taken." };
    }
  }

  let avatarPath = channel.avatarPath;

  if (avatar instanceof File && avatar.size > 0) {
    if (!AVATAR_TYPES.has(avatar.type)) {
      return { ok: false as const, error: "Avatar must be JPG, PNG, or WebP." };
    }
    if (avatar.size > MAX_AVATAR_BYTES) {
      return { ok: false as const, error: "Avatar must be 5 MB or smaller." };
    }
    const ext = avatar.type === "image/png" ? "png" : avatar.type === "image/jpeg" ? "jpg" : "webp";
    avatarPath = `official/${QUBIC_OFFICIAL_CHANNEL_SLOT}/${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await avatar.arrayBuffer());
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(avatarPath, bytes, {
      contentType: avatar.type,
      upsert: true,
    });
    if (uploadErr) return { ok: false as const, error: uploadErr.message };
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
    avatarPath = pub.publicUrl;
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName,
      name: displayName,
      bio: bio || null,
      avatar_path: avatarPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", channel.profileId);

  if (profileErr) return { ok: false as const, error: profileErr.message };

  const maxPostsPerRun = Math.min(Math.max(Number(formData.get("maxPostsPerRun") ?? channel.maxPostsPerRun), 1), 10);
  const ingestIntervalMinutes = Math.min(
    Math.max(Number(formData.get("ingestIntervalMinutes") ?? channel.ingestIntervalMinutes), 15),
    720,
  );

  const { error: channelErr } = await supabase
    .from("official_channels")
    .update({
      active,
      max_posts_per_run: maxPostsPerRun,
      ingest_interval_minutes: ingestIntervalMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("slot", QUBIC_OFFICIAL_CHANNEL_SLOT);

  if (channelErr) return { ok: false as const, error: channelErr.message };

  revalidatePath("/admin");
  revalidatePath("/app/explore");
  revalidatePath(`/u/${username}`);

  return { ok: true as const, message: "Qubic channel updated." };
}

export async function runOfficialQubicIngestNow() {
  await assertAdmin();
  try {
    const result = await runQubicOfficialXIngest();
    if (!result.ok) {
      return { ok: false as const, error: result.error ?? "Ingest failed." };
    }
    return result;
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Ingest failed.",
    };
  }
}

export async function runOfficialQubicImageBackfillNow() {
  await assertAdmin();
  try {
    const result = await backfillQubicXPostImages();
    if (!result.ok) {
      return { ok: false as const, error: result.error ?? "Backfill failed." };
    }
    return result;
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Backfill failed.",
    };
  }
}
