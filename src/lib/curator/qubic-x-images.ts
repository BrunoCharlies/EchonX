import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { moderateImageWithEdgeOrFallback } from "@/lib/moderation-edge";

const MAX_PHOTOS_PER_POST = 4;
const MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_X_MEDIA_HOSTS = new Set(["pbs.twimg.com", "video.twimg.com", "abs.twimg.com"]);

const QUBIC_X_STORAGE_MARKER = "/qubic-x/";

/** True when the post has no images imported from X into Supabase yet. */
export function postNeedsQubicXImageBackfill(imagePaths: string[] | null | undefined) {
  if (!imagePaths?.length) return true;
  return !imagePaths.some((path) => path.includes(QUBIC_X_STORAGE_MARKER));
}

export function isCuratorCardImagePath(path: string) {
  return path.includes("/api/curator/card");
}

export function curatorCardPathsFromExisting(imagePaths: string[] | null | undefined) {
  return (imagePaths ?? []).filter(isCuratorCardImagePath);
}

export function postHasQubicXImportedImages(imagePaths: string[] | null | undefined) {
  return (imagePaths ?? []).some((path) => path.includes(QUBIC_X_STORAGE_MARKER));
}

/** X photos only when import succeeded; otherwise OG card fallback. */
export function qubicPostImagePaths(xImagePaths: string[], cardFallbackPaths: string[]) {
  return xImagePaths.length > 0 ? xImagePaths : cardFallbackPaths;
}

export function stripCuratorCardsFromImagePaths(imagePaths: string[] | null | undefined) {
  return (imagePaths ?? []).filter((path) => !isCuratorCardImagePath(path));
}

export function isAllowedXMediaUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_X_MEDIA_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

async function downloadXMedia(url: string) {
  if (!isAllowedXMediaUrl(url)) return null;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_BYTES || buffer.length < 200) return null;

  return { buffer, contentType };
}

/** Downloads X media, moderates, uploads to post-images — Qubic official channel only. */
export async function importQubicXPostImages(input: {
  supabase: SupabaseClient;
  postId: string;
  mediaUrls: string[];
}): Promise<string[]> {
  const stored: string[] = [];

  for (const remoteUrl of input.mediaUrls.slice(0, MAX_PHOTOS_PER_POST)) {
    if (stored.length >= MAX_PHOTOS_PER_POST) break;

    try {
      const downloaded = await downloadXMedia(remoteUrl);
      if (!downloaded) continue;

      const moderation = await moderateImageWithEdgeOrFallback(
        downloaded.buffer,
        downloaded.contentType,
      );
      if (!moderation.ok) {
        console.warn("[qubic-x-images] moderation rejected", remoteUrl.slice(0, 80));
        continue;
      }

      const ext =
        downloaded.contentType.includes("png")
          ? "png"
          : downloaded.contentType.includes("webp")
            ? "webp"
            : "jpg";
      const path = `qubic-x/${input.postId}/${stored.length}.${ext}`;

      const { error: upErr } = await input.supabase.storage
        .from("post-images")
        .upload(path, downloaded.buffer, {
          contentType: downloaded.contentType,
          upsert: true,
        });
      if (upErr) {
        console.warn("[qubic-x-images] upload failed", upErr.message);
        continue;
      }

      const { data: pub } = input.supabase.storage.from("post-images").getPublicUrl(path);
      stored.push(pub.publicUrl);
    } catch (error) {
      console.warn("[qubic-x-images] import failed", remoteUrl.slice(0, 80), error);
    }
  }

  return stored;
}
