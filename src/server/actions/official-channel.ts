"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ensureNewsOfficialChannel,
  getNewsOfficialChannelState,
  runNewsCuratorIngest,
  type OfficialChannelState,
} from "@/lib/curator/ingest";
import { NEWS_OFFICIAL_CHANNEL_SLOT, NEWS_OFFICIAL_USERNAME } from "@/lib/curator/constants";
import { createServiceRoleClient } from "@/lib/supabase/service";

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

async function assertAdmin() {
  const session = await auth();
  if (session?.user.role !== "admin") throw new Error("Only admins can manage the official channel.");
  return session;
}

export async function getOfficialNewsChannel(): Promise<OfficialChannelState> {
  return getNewsOfficialChannelState();
}

export async function saveOfficialNewsChannelProfile(formData: FormData) {
  await assertAdmin();

  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? NEWS_OFFICIAL_USERNAME)
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

  const channel = await getNewsOfficialChannelState();
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
    avatarPath = `official/${NEWS_OFFICIAL_CHANNEL_SLOT}/${Date.now()}.${ext}`;
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
    Math.max(Number(formData.get("ingestIntervalMinutes") ?? channel.ingestIntervalMinutes), 30),
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
    .eq("slot", NEWS_OFFICIAL_CHANNEL_SLOT);

  if (channelErr) return { ok: false as const, error: channelErr.message };

  revalidatePath("/admin");
  revalidatePath("/app/explore");
  revalidatePath(`/u/${username}`);

  return { ok: true as const, message: "News channel updated." };
}

export async function saveOfficialNewsFeedSources(formData: FormData) {
  await assertAdmin();
  await ensureNewsOfficialChannel();

  const labels = formData.getAll("sourceLabel").map((v) => String(v).trim());
  const urls = formData.getAll("sourceUrl").map((v) => String(v).trim());
  const actives = formData.getAll("sourceActive").map((v) => String(v) === "true");

  const sources = labels
    .map((label, index) => ({
      label,
      feedUrl: urls[index] ?? "",
      active: actives[index] ?? true,
    }))
    .filter((row) => row.label && row.feedUrl);

  for (const row of sources) {
    try {
      const parsed = new URL(row.feedUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { ok: false as const, error: `Invalid feed URL: ${row.feedUrl}` };
      }
    } catch {
      return { ok: false as const, error: `Invalid feed URL: ${row.feedUrl}` };
    }
  }

  const supabase = createServiceRoleClient();
  const { error: deleteErr } = await supabase
    .from("curator_feed_sources")
    .delete()
    .eq("channel_slot", NEWS_OFFICIAL_CHANNEL_SLOT);
  if (deleteErr) return { ok: false as const, error: deleteErr.message };

  if (sources.length) {
    const { error: insertErr } = await supabase.from("curator_feed_sources").insert(
      sources.map((row) => ({
        channel_slot: NEWS_OFFICIAL_CHANNEL_SLOT,
        label: row.label,
        feed_url: row.feedUrl,
        active: row.active,
      })),
    );
    if (insertErr) return { ok: false as const, error: insertErr.message };
  }

  revalidatePath("/admin");
  return { ok: true as const, message: "RSS sources saved." };
}

export async function runOfficialNewsIngestNow() {
  await assertAdmin();
  try {
    const result = await runNewsCuratorIngest();
    return result;
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Ingest failed.",
    };
  }
}
