import type { ModerationResult } from "@/lib/moderation";
import { moderateImageBuffer } from "@/lib/moderation";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

/**
 * Calls the Supabase Edge Function `moderate-image` (Sightengine inside Deno).
 * Falls back to the Node moderation helper when the function is unavailable (local dev).
 */
export async function moderateImageWithEdgeOrFallback(buffer: Buffer, mime: string): Promise<ModerationResult> {
  const useEdge = process.env.MODERATION_USE_EDGE !== "false";
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (useEdge && url && serviceKey) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/functions/v1/moderate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          imageBase64: buffer.toString("base64"),
          mimeType: mime || "image/webp",
        }),
      });

      const json = (await res.json()) as ModerationResult & { raw?: unknown };
      if (res.ok && typeof json.ok === "boolean") {
        return json;
      }
      // Non-OK: try parse body for structured failure
      if (typeof json.ok === "boolean") {
        return json;
      }
    } catch {
      // fall through to local moderation
    }
  }

  return moderateImageBuffer(buffer, mime);
}
