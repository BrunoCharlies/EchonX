import { z } from "zod";

const sightengineSchema = z.object({
  status: z.string(),
  nudity: z.any().optional(),
  weapon: z.any().optional(),
  recreational_drug: z.any().optional(),
});

export type ModerationResult = {
  ok: boolean;
  provider: string;
  raw?: unknown;
  reason?: string;
};

export async function moderateImageBuffer(buffer: Buffer, mime: string): Promise<ModerationResult> {
  const provider = process.env.MODERATION_PROVIDER ?? "sightengine";
  const user = process.env.MODERATION_API_USER;
  const secret = process.env.MODERATION_API_SECRET;

  if (provider === "sightengine" && user && secret) {
    const form = new FormData();
    form.append("media", new Blob([new Uint8Array(buffer)], { type: mime }), "upload.jpg");
    form.append("models", "nudity-2.0,weapon,recreational_drug");
    form.append("api_user", user);
    form.append("api_secret", secret);

    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      return { ok: false, provider, reason: "moderation_http_error" };
    }

    const json = await res.json();
    const parsed = sightengineSchema.safeParse(json);
    if (!parsed.success || parsed.data.status !== "success") {
      return { ok: false, provider, reason: "moderation_parse_error", raw: json };
    }

    const nudity = (json as { nudity?: { sexual_activity?: number; sexual_display?: number; erotica?: number } }).nudity;
    const sexualScore = Math.max(nudity?.sexual_activity ?? 0, nudity?.sexual_display ?? 0, nudity?.erotica ?? 0);
    if (sexualScore > 0.65) {
      return { ok: false, provider, reason: "adult_content", raw: json };
    }

    return { ok: true, provider, raw: json };
  }

  // Without Sightengine keys: allow upload unless explicitly required (edge function may still run).
  if (process.env.MODERATION_REQUIRE_SIGHTENGINE === "true") {
    return { ok: false, provider, reason: "moderation_not_configured" };
  }

  console.warn("[moderation] Safety review API not configured — allowing upload.");
  return { ok: true, provider: "skipped", reason: "moderation_not_configured" };
}
