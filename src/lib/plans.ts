import { formatUsd } from "@/lib/utils";

export type PlanTier = "free" | "starter" | "popular" | "pro";

export type Plan = {
  id: PlanTier;
  name: string;
  priceUsd: number;
  /** Max external X profiles in want_to_hear; null = unlimited (Pro). */
  maxExternalXProfiles: number | null;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

/**
 * Max custom external X profiles (excludes official @qubic channel + native EchonX).
 * Free = 0 (only Qubic official + natives). Starter+ = paid slots.
 */
export const PLAN_EXTERNAL_X_LIMITS: Record<PlanTier, number | null> = {
  free: 0,
  starter: 3,
  popular: 5,
  pro: 15,
};

export function maxExternalXProfilesForPlan(plan: PlanTier): number | null {
  return PLAN_EXTERNAL_X_LIMITS[plan];
}

export function canAddCustomExternalXAccounts(plan: PlanTier): boolean {
  const max = maxExternalXProfilesForPlan(plan);
  return max === null || max > 0;
}

export function externalXLimitLabel(plan: PlanTier): string {
  if (plan === "free") {
    return "Official @qubic on X + unlimited native EchonX (no other X accounts)";
  }
  const max = maxExternalXProfilesForPlan(plan);
  if (max === null) return "Unlimited external X profiles";
  return max === 1 ? "1 external X profile" : `Up to ${max} external X profiles`;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    maxExternalXProfiles: 0,
    description: "Listen to official @qubic on X and every native EchonX profile—no custom X accounts.",
    features: [
      "Official @qubic channel on X (free)",
      "Unlimited native EchonX profiles (free to read)",
      "Up to 5 posts per day",
      "Public posts with up to 4 images each",
      "Automatic image moderation on every upload",
      "On-device audio listening",
    ],
    cta: "Start with Free",
  },
  {
    id: "starter",
    name: "Starter",
    priceUsd: 9,
    maxExternalXProfiles: 3,
    description: "Follow up to three voices on X outside EchonX, with native profiles still unlimited.",
    features: [
      "Everything in Free, plus 3 custom external X profiles",
      "Unlimited native EchonX profiles",
      "Unlimited posts with moderation and compression",
      "Automatic queue for new posts after you subscribe",
      "Manual Listen for older posts",
    ],
    cta: "Choose Starter",
  },
  {
    id: "popular",
    name: "Popular",
    priceUsd: 19,
    maxExternalXProfiles: 5,
    description: "Follow a small circle of creators on X while keeping native profiles wide open.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Up to 5 external X profiles",
      "Unlimited native EchonX profiles",
      "Everything in Starter, with higher external coverage",
      "Priority audio handling for US-focused features",
    ],
    cta: "Choose Popular",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 39,
    maxExternalXProfiles: 15,
    description: "Power listeners and creators who live in audio-first conversations.",
    features: [
      "Up to 15 external X profiles",
      "Unlimited native EchonX profiles",
      "Audio comments (Pro exclusive)",
      "Advanced moderation telemetry in dashboard reports",
      "Priority support",
    ],
    cta: "Choose Pro",
  },
];

export function planPriceLabel(plan: Plan) {
  if (plan.priceUsd === 0) return "US$0";
  return `${formatUsd(plan.priceUsd)}/mo`;
}

export function getPlanById(tier: PlanTier): Plan {
  return PLANS.find((p) => p.id === tier) ?? PLANS[0];
}
