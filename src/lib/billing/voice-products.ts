/**
 * Voice product rules — Audiopost (queue) and Library are billed and configured separately.
 * Enforcement hooks will read these once Fish + Stripe Premium are wired in production.
 */

import type { PlanTier } from "@/lib/plans";

/** Which TTS backend applies to a surface. */
export type VoiceBackend = "web-speech" | "fish-s2-pro";

/** Audiopost / queue / Now Playing — tied to subscription tier. */
export function audiopostVoiceBackend(plan: PlanTier): VoiceBackend {
  return plan === "free" ? "web-speech" : "fish-s2-pro";
}

/** True when the user's paid plan includes Fish for the main Audiopost player (not the admin lab). */
export function canUseFishAudiopostTts(plan: PlanTier): boolean {
  return audiopostVoiceBackend(plan) === "fish-s2-pro";
}

/** Library listening — independent of Starter/Popular/Pro. */
export type LibraryVoiceAccess = {
  backend: VoiceBackend;
  /** Monthly UTF-8 byte budget for Fish API (library only). */
  monthlyByteQuota: number;
};

export const LIBRARY_VOICE_FREE: LibraryVoiceAccess = {
  backend: "web-speech",
  monthlyByteQuota: 0,
};

/** Legacy single-tier constants — prefer LIBRARY_PLAN_QUOTAS in library-plans.ts */
export const LIBRARY_PREMIUM_USD_PER_MONTH = 9;
export const LIBRARY_PREMIUM_MONTHLY_BYTE_QUOTA = 300_000;
/** @deprecated Library has no mid-cycle refills — only tier upgrades (see library-quota-policy.ts). */
export const LIBRARY_PREMIUM_REFILL_BYTES = 0;
/** @deprecated */
export const LIBRARY_PREMIUM_REFILL_USD = 0;

export { LIBRARY_PLAN_QUOTAS, LIBRARY_PLANS } from "@/lib/billing/library-plans";

export const LIBRARY_VOICE_PREMIUM: LibraryVoiceAccess = {
  backend: "fish-s2-pro",
  monthlyByteQuota: LIBRARY_PREMIUM_MONTHLY_BYTE_QUOTA,
};

export function libraryVoiceAccess(premiumActive: boolean): LibraryVoiceAccess {
  return premiumActive ? LIBRARY_VOICE_PREMIUM : LIBRARY_VOICE_FREE;
}

/** Fish list price reference (API): US$ 15 / 1M UTF-8 bytes. */
export const FISH_USD_PER_MILLION_UTF8_BYTES = 15;

export function fishCostUsdForBytes(bytes: number): number {
  return (bytes / 1_000_000) * FISH_USD_PER_MILLION_UTF8_BYTES;
}
