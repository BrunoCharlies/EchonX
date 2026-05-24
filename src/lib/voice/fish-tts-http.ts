import { fishApiKeyConfigured, synthesizeFishSpeech } from "@/lib/voice/fish-audio";
import { normalizeSpeechLocale } from "@/lib/voice/speech-locale";
import { prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";

export type FishTtsJsonBody = {
  text?: string;
  lang?: string;
  rate?: number;
};

export function fishTtsStatusPayload(surface: string) {
  return {
    configured: fishApiKeyConfigured(),
    model: process.env.FISH_AUDIO_MODEL?.trim() || "s2-pro",
    surface,
  };
}

export async function synthesizeFishTtsResponse(body: FishTtsJsonBody): Promise<Response> {
  if (!fishApiKeyConfigured()) {
    return Response.json(
      {
        error: "Fish Audio API key missing. Set FISH_AUDIO_API_KEY in .env.local and restart npm run dev.",
      },
      { status: 503 },
    );
  }

  const raw = String(body.text ?? "").trim();
  if (!raw) {
    return Response.json({ error: "text_required" }, { status: 400 });
  }

  const text = prepareMirroredPostForSpeech(raw);
  if (!text) {
    return Response.json({ error: "no_speakable_text" }, { status: 400 });
  }

  try {
    const audio = await synthesizeFishSpeech({
      text,
      lang: normalizeSpeechLocale(body.lang),
      rate: typeof body.rate === "number" ? body.rate : undefined,
    });

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-EchonX-TTS-Text": encodeURIComponent(text.slice(0, 120)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "fish_tts_failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
