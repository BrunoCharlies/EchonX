import { createFishVoiceEngine } from "@/lib/voice/fish-voice-engine";
import { isAppleMobileBrowser } from "@/lib/voice/ios-speech-unlock";
import { createVoiceEngine, type VoiceEngine } from "@/lib/voice/voice-engine";
import type { LibraryQuotaExhaustedAction } from "@/lib/billing/library-quota-policy";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";

export const LIBRARY_TTS_PATH = "/api/library/tts";

export type LibraryVoiceStatus = {
  backend: "web-speech" | "fish-s2-pro";
  fishActive: boolean;
  plan: LibraryPlanTier | null;
  bytesConsumed: number;
  periodByteQuota: number;
  bytesRemaining: number | null;
  exhaustedAction: LibraryQuotaExhaustedAction | null;
  paidPlanExpired: boolean;
  currentPeriodEnd: string | null;
  upgradeUrl: string | null;
  configured: boolean;
};

let cachedBackendKey: "fish" | "web" | null = null;
let enginePromise: Promise<VoiceEngine> | null = null;
let lastStatus: LibraryVoiceStatus | null = null;

export async function fetchLibraryVoiceStatus(): Promise<LibraryVoiceStatus> {
  const res = await fetch(LIBRARY_TTS_PATH, { cache: "no-store" });
  if (!res.ok) {
    const fallback: LibraryVoiceStatus = {
      backend: "web-speech",
      fishActive: false,
      plan: null,
      bytesConsumed: 0,
      periodByteQuota: 0,
      bytesRemaining: null,
      exhaustedAction: null,
      paidPlanExpired: false,
      currentPeriodEnd: null,
      upgradeUrl: null,
      configured: false,
    };
    lastStatus = fallback;
    return fallback;
  }
  const data = (await res.json()) as LibraryVoiceStatus;
  lastStatus = data;
  return data;
}

export function getCachedLibraryVoiceStatus(): LibraryVoiceStatus | null {
  return lastStatus;
}

function backendKey(status: LibraryVoiceStatus): "fish" | "web" {
  if (typeof navigator !== "undefined" && isAppleMobileBrowser()) {
    return "web";
  }
  return status.backend === "fish-s2-pro" && status.fishActive ? "fish" : "web";
}

/**
 * Fish when paid + quota available; otherwise Web Speech (free = unlimited browser voice).
 */
export async function getLibraryVoiceEngine(): Promise<{
  engine: VoiceEngine;
  status: LibraryVoiceStatus;
}> {
  const status = await fetchLibraryVoiceStatus();
  const key = backendKey(status);

  if (key !== cachedBackendKey) {
    cachedBackendKey = key;
    enginePromise =
      key === "fish"
        ? Promise.resolve(createFishVoiceEngine({ ttsPath: LIBRARY_TTS_PATH }))
        : createVoiceEngine();
  }

  const engine = await enginePromise!;
  return { engine, status };
}

export function resetLibraryVoiceEngine() {
  cachedBackendKey = null;
  enginePromise = null;
  lastStatus = null;
}

export function libraryQuotaErrorMessage(status: LibraryVoiceStatus): string | null {
  if (status.fishActive) return null;
  if (status.exhaustedAction?.kind === "upgrade") {
    return "Premium voice allowance used up. Upgrade your Library plan for more Fish narration this month.";
  }
  if (status.exhaustedAction?.kind === "wait_renewal") {
    const end = status.currentPeriodEnd
      ? new Date(status.currentPeriodEnd).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;
    return end
      ? `Premium voice renews on ${end}. Browser voice is still unlimited.`
      : "Premium voice renews at your next billing date. Browser voice is still unlimited.";
  }
  if (status.paidPlanExpired) {
    return "Library Premium expired. Renew in billing settings or keep using browser voice.";
  }
  return null;
}
