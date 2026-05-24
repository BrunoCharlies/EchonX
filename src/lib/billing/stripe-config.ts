import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import type { PlanTier } from "@/lib/plans";

export const STRIPE_BILLING_PRODUCT_AUDIOPOST = "audiopost";
export const STRIPE_BILLING_PRODUCT_LIBRARY = "library";
export const STRIPE_BILLING_PRODUCT_AI = "ai-analysis";

const PAID_PLANS: PlanTier[] = ["starter", "popular", "pro"];
const PAID_LIBRARY_PLANS: LibraryPlanTier[] = [
  "library-starter",
  "library-popular",
  "library-pro",
];

export function isPaidAudiopostPlan(plan: PlanTier): plan is Exclude<PlanTier, "free"> {
  return PAID_PLANS.includes(plan);
}

export function getStripePriceIdForPlan(plan: PlanTier): string | null {
  switch (plan) {
    case "starter":
      return process.env.STRIPE_PRICE_STARTER?.trim() || null;
    case "popular":
      return process.env.STRIPE_PRICE_POPULAR?.trim() || null;
    case "pro":
      return process.env.STRIPE_PRICE_PRO?.trim() || null;
    default:
      return null;
  }
}

export function planTierFromStripePriceId(priceId: string | undefined | null): PlanTier | null {
  if (!priceId) return null;
  const entries: [PlanTier, string | null][] = [
    ["starter", getStripePriceIdForPlan("starter")],
    ["popular", getStripePriceIdForPlan("popular")],
    ["pro", getStripePriceIdForPlan("pro")],
  ];
  for (const [tier, envPrice] of entries) {
    if (envPrice && envPrice === priceId) return tier;
  }
  return null;
}

/** Checkout sessions (needs secret + price IDs). Webhook is separate for plan activation. */
export function isStripeBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      getStripePriceIdForPlan("starter") &&
      getStripePriceIdForPlan("popular") &&
      getStripePriceIdForPlan("pro"),
  );
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function isPaidLibraryPlan(
  plan: LibraryPlanTier,
): plan is LibraryPlanTier {
  return PAID_LIBRARY_PLANS.includes(plan);
}

export function getStripePriceIdForLibraryPlan(plan: LibraryPlanTier): string | null {
  switch (plan) {
    case "library-starter":
      return process.env.STRIPE_PRICE_LIBRARY_STARTER?.trim() || null;
    case "library-popular":
      return process.env.STRIPE_PRICE_LIBRARY_POPULAR?.trim() || null;
    case "library-pro":
      return process.env.STRIPE_PRICE_LIBRARY_PRO?.trim() || null;
    default:
      return null;
  }
}

export function libraryPlanTierFromStripePriceId(
  priceId: string | undefined | null,
): LibraryPlanTier | null {
  if (!priceId) return null;
  const entries: [LibraryPlanTier, string | null][] = [
    ["library-starter", getStripePriceIdForLibraryPlan("library-starter")],
    ["library-popular", getStripePriceIdForLibraryPlan("library-popular")],
    ["library-pro", getStripePriceIdForLibraryPlan("library-pro")],
  ];
  for (const [tier, envPrice] of entries) {
    if (envPrice && envPrice === priceId) return tier;
  }
  return null;
}

export function isStripeLibraryBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      getStripePriceIdForLibraryPlan("library-starter") &&
      getStripePriceIdForLibraryPlan("library-popular") &&
      getStripePriceIdForLibraryPlan("library-pro"),
  );
}

export function getStripePriceIdForAiAnalysis(): string | null {
  return process.env.STRIPE_PRICE_AI_ANALYSIS?.trim() || null;
}

export function isStripeAiBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim() && getStripePriceIdForAiAnalysis());
}
