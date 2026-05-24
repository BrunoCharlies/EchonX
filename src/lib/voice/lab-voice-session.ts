import { createFishVoiceEngine } from "@/lib/voice/fish-voice-engine";
import { createVoiceEngine, type VoiceEngine } from "@/lib/voice/voice-engine";

export type LabVoiceMode = "fish" | "web-speech" | "auto";

let labEnginePromise: Promise<VoiceEngine> | null = null;
let labMode: LabVoiceMode = "auto";

/** Set before first getLabVoiceEngine() in the sandbox UI. */
export function setLabVoiceMode(mode: LabVoiceMode) {
  labMode = mode;
  labEnginePromise = null;
}

export function getLabVoiceMode() {
  return labMode;
}

async function resolveLabEngine(): Promise<VoiceEngine> {
  const preferFish = labMode === "fish" || labMode === "auto";
  if (preferFish) {
    try {
      const status = await fetch("/api/admin/lab/tts", { method: "GET" });
      if (status.ok) {
        const data = (await status.json()) as { configured?: boolean };
        if (data.configured) {
          return createFishVoiceEngine();
        }
      }
    } catch {
      // Fall through to Web Speech.
    }
  }
  if (labMode === "fish") {
    throw new Error("Fish Audio is not configured. Add FISH_AUDIO_API_KEY to .env.local and restart the dev server.");
  }
  return createVoiceEngine();
}

/** Isolated engine for /admin/lab/voice — does not use getSharedVoiceEngine(). */
export function getLabVoiceEngine(): Promise<VoiceEngine> {
  if (!labEnginePromise) {
    labEnginePromise = resolveLabEngine();
  }
  return labEnginePromise;
}

export function resetLabVoiceEngine() {
  labEnginePromise = null;
}
