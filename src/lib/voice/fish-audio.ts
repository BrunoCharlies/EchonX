/** Server-side Fish Audio OpenAPI v1 helpers. */

import { normalizeSpeechLocale } from "@/lib/voice/speech-locale";

export const FISH_AUDIO_API_BASE = "https://api.fish.audio";
export type FishTtsModel = "s2-pro" | "s1";

export type FishTtsRequest = {
  text: string;
  lang?: string;
  rate?: number;
  model?: FishTtsModel;
};

export function fishApiKeyConfigured(): boolean {
  return Boolean(process.env.FISH_AUDIO_API_KEY?.trim());
}

export function fishReferenceIdForLang(lang?: string): string | undefined {
  const locale = normalizeSpeechLocale(lang);
  switch (locale) {
    case "pt-BR":
      return process.env.FISH_AUDIO_REFERENCE_ID_PT_BR?.trim() || undefined;
    case "es-ES":
      return process.env.FISH_AUDIO_REFERENCE_ID_ES?.trim() || undefined;
    case "fr-FR":
      return process.env.FISH_AUDIO_REFERENCE_ID_FR?.trim() || undefined;
    case "en-US":
    default:
      return process.env.FISH_AUDIO_REFERENCE_ID_EN?.trim() || undefined;
  }
}

function clampFishSpeed(rate?: number) {
  const r = rate ?? 1;
  return Math.min(2, Math.max(0.5, r));
}

export async function synthesizeFishSpeech(input: FishTtsRequest): Promise<ArrayBuffer> {
  const apiKey = process.env.FISH_AUDIO_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("FISH_AUDIO_API_KEY is not configured.");
  }

  const model = (process.env.FISH_AUDIO_MODEL?.trim() as FishTtsModel | undefined) ?? input.model ?? "s2-pro";
  const referenceId = fishReferenceIdForLang(input.lang);

  const body: Record<string, unknown> = {
    text: input.text,
    format: "mp3",
    mp3_bitrate: 128,
    latency: "balanced",
    prosody: {
      speed: clampFishSpeed(input.rate),
      volume: 0,
      normalize_loudness: true,
    },
  };

  if (referenceId) {
    body.reference_id = referenceId;
  }

  const response = await fetch(`${FISH_AUDIO_API_BASE}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      model,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Fish TTS failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  return response.arrayBuffer();
}
