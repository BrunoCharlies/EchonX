import { createFishVoiceEngine } from "@/lib/voice/fish-voice-engine";
import { createVoiceEngine, type VoiceEngine } from "@/lib/voice/voice-engine";

const AUDIOPOST_TTS_PATH = "/api/listening/tts";

let audiopostEnginePromise: Promise<VoiceEngine> | null = null;

async function resolveAudiopostEngine(): Promise<VoiceEngine> {
  try {
    const res = await fetch(AUDIOPOST_TTS_PATH, { method: "GET", cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { backend?: string; configured?: boolean };
      if (data.backend === "fish-s2-pro" && data.configured) {
        return createFishVoiceEngine({ ttsPath: AUDIOPOST_TTS_PATH });
      }
    }
  } catch {
    // Fall through to Web Speech.
  }
  return createVoiceEngine();
}

/**
 * Queue / Now Playing on /app and floating Audiopost.
 * Fish only when GET /api/listening/tts reports backend fish-s2-pro (paid plan + API key).
 * Free subscribers always resolve to Web Speech.
 */
export function getAudiopostVoiceEngine(): Promise<VoiceEngine> {
  if (!audiopostEnginePromise) {
    audiopostEnginePromise = resolveAudiopostEngine();
  }
  return audiopostEnginePromise;
}

export function resetAudiopostVoiceEngine() {
  audiopostEnginePromise = null;
}
