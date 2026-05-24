/**
 * Library Premium — separate from Audiopost (Starter/Popular/Pro).
 * Byte quotas map to Fish TTS usage for Gutenberg + uploaded PDFs.
 */

export type LibraryPlanTier = "library-starter" | "library-popular" | "library-pro";

export type LibraryPlan = {
  id: LibraryPlanTier;
  name: string;
  priceUsd: number;
  /** Monthly UTF-8 byte budget sent to Fish TTS for library listening. */
  monthlyByteQuota: number;
  description: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  cta: string;
};

/** Rough narration pace for books/PDFs (~150 wpm, UTF-8). Used for lay-friendly copy only. */
export const LIBRARY_BYTES_PER_MINUTE_ESTIMATE = 1_000;

export const LIBRARY_PLAN_QUOTAS: Record<LibraryPlanTier, number> = {
  "library-starter": 300_000,
  "library-popular": 600_000,
  "library-pro": 1_200_000,
};

export function estimateLibraryListeningMinutes(byteQuota: number): number {
  return Math.max(1, Math.round(byteQuota / LIBRARY_BYTES_PER_MINUTE_ESTIMATE));
}

/** Plain-language listening time for pricing cards (non-technical users). */
export function formatLibraryListeningAllowance(byteQuota: number): {
  headline: string;
  subline: string;
} {
  const minutes = estimateLibraryListeningMinutes(byteQuota);
  const hours = minutes / 60;

  if (minutes < 90) {
    return {
      headline: `About ${minutes} minutes of listening per month`,
      subline: `Voice allowance: up to ${formatBytesShort(byteQuota)} of narrated text`,
    };
  }

  if (hours < 8) {
    const roundedHours = Math.round(hours);
    return {
      headline: `About ${roundedHours} hour${roundedHours === 1 ? "" : "s"} of listening per month`,
      subline: `Voice allowance: up to ${formatBytesShort(byteQuota)} of narrated text`,
    };
  }

  const low = Math.floor(hours);
  const high = Math.ceil(hours);
  const headline =
    low === high
      ? `About ${low} hours of listening per month`
      : `About ${low}–${high} hours of listening per month`;

  return {
    headline,
    subline: `Voice allowance: up to ${formatBytesShort(byteQuota)} of narrated text`,
  };
}

function formatBytesShort(bytes: number): string {
  if (bytes >= 1_000_000) {
    const millions = bytes / 1_000_000;
    return millions % 1 === 0 ? `${millions}M characters` : `${millions.toFixed(1)}M characters`;
  }
  if (bytes >= 1_000) {
    return `${Math.round(bytes / 1_000)}k characters`;
  }
  return `${bytes} characters`;
}

function listeningFeature(byteQuota: number): string {
  return formatLibraryListeningAllowance(byteQuota).headline;
}

export const LIBRARY_PLANS: LibraryPlan[] = [
  {
    id: "library-starter",
    name: "Library Starter",
    priceUsd: 9,
    monthlyByteQuota: LIBRARY_PLAN_QUOTAS["library-starter"],
    description: "Premium narrated voice for the public library and your PDF uploads—ideal for light monthly reading.",
    features: [
      listeningFeature(300_000),
      "Up to 300k characters of narrated text / month",
      "Fish S2 Pro voice (studio quality)",
      "Gutenberg catalog + your PDF uploads",
      "Need more time this month? Upgrade to Library Popular",
      "Separate from your Audiopost plan",
    ],
    cta: "Choose Library Starter",
  },
  {
    id: "library-popular",
    name: "Library Popular",
    priceUsd: 17,
    monthlyByteQuota: LIBRARY_PLAN_QUOTAS["library-popular"],
    description: "Double the listening time for regular book listeners who want more chapters per month.",
    badge: "Best value",
    highlighted: true,
    features: [
      listeningFeature(600_000),
      "Up to 600k characters of narrated text / month",
      "Everything in Library Starter",
      "More monthly narration for long books",
      "Out of hours? Upgrade to Library Pro for more this cycle",
    ],
    cta: "Choose Library Popular",
  },
  {
    id: "library-pro",
    name: "Library Pro",
    priceUsd: 29,
    monthlyByteQuota: LIBRARY_PLAN_QUOTAS["library-pro"],
    description: "For power readers and long PDFs who want the largest monthly voice allowance.",
    features: [
      listeningFeature(1_200_000),
      "Up to 1.2M characters of narrated text / month",
      "Everything in Library Popular",
      "Largest monthly voice pool for library",
      "No add-on hours — allowance renews each billing cycle",
      "Best for multi-book or heavy PDF use",
    ],
    cta: "Choose Library Pro",
  },
];

export function getLibraryPlanById(tier: LibraryPlanTier): LibraryPlan {
  return LIBRARY_PLANS.find((p) => p.id === tier) ?? LIBRARY_PLANS[0];
}
