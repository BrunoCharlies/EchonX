import { createHash } from "crypto";

/** Stable hash for post body + image URLs — invalidates cache when content changes. */
export function hashPostContent(body: string, imagePaths: string[] | null | undefined): string {
  const payload = JSON.stringify({
    body: body.trim(),
    images: (imagePaths ?? []).map((p) => p.trim()).sort(),
  });
  return createHash("sha256").update(payload).digest("hex");
}
