import { formatUsd } from "@/lib/utils";

export type PlanTier = "free" | "starter" | "popular" | "pro";

export type Plan = {
  id: PlanTier;
  name: string;
  priceUsd: number;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    description: "Experience EchonX with a lightweight X profile slot and generous native publishing.",
    features: [
      "1 external X profile for listening",
      "Unlimited native EchonX profiles (free to read)",
      "Up to 5 posts per day",
      "Public posts with up to 4 images each",
      "Automatic image moderation on every upload",
      "On-device Supertonic listening",
    ],
    cta: "Start with Free",
  },
  {
    id: "starter",
    name: "Starter",
    priceUsd: 9,
    description: "Perfect when you follow one important voice outside EchonX every single day.",
    features: [
      "1 external X profile for listening",
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
    description: "Follow a small circle of creators on X while keeping native profiles wide open.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Up to 3 external X profiles",
      "Unlimited native EchonX profiles",
      "Everything in Starter, with higher external coverage",
      "Priority roadmap input for US-focused features",
    ],
    cta: "Choose Popular",
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 29,
    description: "Power listeners and creators who live in audio-first conversations.",
    features: [
      "Unlimited external X profiles",
      "Unlimited native EchonX profiles",
      "Audio comments (Pro exclusive)",
      "Advanced moderation telemetry in dashboard exports",
    ],
    cta: "Choose Pro",
  },
];

export function planPriceLabel(plan: Plan) {
  if (plan.priceUsd === 0) return "US$0";
  return `${formatUsd(plan.priceUsd)}/mo`;
}
