/**
 * Library Premium — confirmed product policy (2026-05).
 *
 * Free: unlimited listening via Web Speech (browser); no byte quota.
 * Paid (Starter / Popular / Pro): Fish S2 Pro; monthly byte quota per tier.
 *
 * Mid-cycle quota exhausted:
 * - Upgrade only (delta between tier quotas, rule A).
 * - Each tier change = new Stripe Checkout for that plan's Price ID.
 * - Pro exhausted → wait until recurring payment renews the cycle (no refills).
 *
 * Downgrade: effective cap drops immediately (rule 3).
 * Renewal: bytes_consumed resets; period_byte_quota = tier monthly quota.
 */

import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { LIBRARY_PLAN_QUOTAS } from "@/lib/billing/library-plans";

export const LIBRARY_PLAN_ORDER: LibraryPlanTier[] = [
  "library-starter",
  "library-popular",
  "library-pro",
];

export const LIBRARY_TOP_TIER: LibraryPlanTier = "library-pro";

export function libraryPlanRank(tier: LibraryPlanTier): number {
  return LIBRARY_PLAN_ORDER.indexOf(tier);
}

export function isTopLibraryTier(tier: LibraryPlanTier): boolean {
  return tier === LIBRARY_TOP_TIER;
}

export function libraryUpgradeTarget(current: LibraryPlanTier): LibraryPlanTier | null {
  const idx = libraryPlanRank(current);
  if (idx < 0 || idx >= LIBRARY_PLAN_ORDER.length - 1) return null;
  return LIBRARY_PLAN_ORDER[idx + 1] ?? null;
}

export function canUpgradeLibraryPlan(current: LibraryPlanTier): boolean {
  return libraryUpgradeTarget(current) !== null;
}

/** Rule A: extra bytes when upgrading within the same billing cycle. */
export function libraryQuotaDeltaOnUpgrade(
  from: LibraryPlanTier,
  to: LibraryPlanTier,
): number {
  if (libraryPlanRank(to) <= libraryPlanRank(from)) return 0;
  return Math.max(0, LIBRARY_PLAN_QUOTAS[to] - LIBRARY_PLAN_QUOTAS[from]);
}

export function libraryMonthlyQuota(tier: LibraryPlanTier): number {
  return LIBRARY_PLAN_QUOTAS[tier];
}

/** UTF-8 byte length charged against the monthly Fish allowance. */
export function libraryUtf8ByteLength(text: string): number {
  if (!text) return 0;
  return new TextEncoder().encode(text).length;
}

export function billingLibraryUpgradeUrl(plan: LibraryPlanTier): string {
  return `/app/settings/billing?library=${encodeURIComponent(plan)}`;
}

export function formatLibraryQuotaShort(bytes: number): string {
  if (bytes >= 1_000_000) {
    const m = bytes / 1_000_000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)}k`;
  return String(bytes);
}

export type LibraryQuotaExhaustedAction =
  | { kind: "upgrade"; targetPlan: LibraryPlanTier }
  | { kind: "wait_renewal" };

export function libraryActionWhenQuotaExhausted(
  currentPlan: LibraryPlanTier,
): LibraryQuotaExhaustedAction {
  const target = libraryUpgradeTarget(currentPlan);
  if (target) return { kind: "upgrade", targetPlan: target };
  return { kind: "wait_renewal" };
}

export type LibrarySubscriptionSnapshot = {
  plan: LibraryPlanTier | null;
  bytesConsumed: number;
  periodByteQuota: number;
  currentPeriodEnd: string | null;
};

/** Remaining Fish bytes this cycle; null = no paid library plan. */
export function libraryBytesRemaining(snapshot: LibrarySubscriptionSnapshot): number | null {
  if (!snapshot.plan) return null;
  return Math.max(0, snapshot.periodByteQuota - snapshot.bytesConsumed);
}

export function isLibraryFishQuotaExhausted(snapshot: LibrarySubscriptionSnapshot): boolean {
  if (!snapshot.plan) return true;
  const remaining = libraryBytesRemaining(snapshot);
  return remaining === null || remaining <= 0;
}

export function isLibraryPaidPeriodActive(
  plan: LibraryPlanTier | null,
  currentPeriodEnd: string | null,
): boolean {
  if (!plan) return false;
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd) > new Date();
}

export type LibraryPlanTransition =
  | { kind: "new"; plan: LibraryPlanTier }
  | { kind: "upgrade"; from: LibraryPlanTier; to: LibraryPlanTier }
  | { kind: "downgrade"; from: LibraryPlanTier; to: LibraryPlanTier }
  | { kind: "renew"; plan: LibraryPlanTier }
  | { kind: "same"; plan: LibraryPlanTier }
  | { kind: "cancel" };

export function detectLibraryPlanTransition(
  previousPlan: LibraryPlanTier | null,
  nextPlan: LibraryPlanTier | null,
  periodRenewed: boolean,
): LibraryPlanTransition {
  if (!nextPlan) return { kind: "cancel" };
  if (!previousPlan) return { kind: "new", plan: nextPlan };
  if (periodRenewed) return { kind: "renew", plan: nextPlan };
  if (libraryPlanRank(nextPlan) > libraryPlanRank(previousPlan)) {
    return { kind: "upgrade", from: previousPlan, to: nextPlan };
  }
  if (libraryPlanRank(nextPlan) < libraryPlanRank(previousPlan)) {
    return { kind: "downgrade", from: previousPlan, to: nextPlan };
  }
  return { kind: "same", plan: nextPlan };
}

/** Apply transition to DB fields (bytes_consumed unchanged except on renew/new). */
export function applyLibraryPlanTransition(
  transition: LibraryPlanTransition,
  previous: { bytesConsumed: number; periodByteQuota: number },
): { bytesConsumed: number; periodByteQuota: number } {
  switch (transition.kind) {
    case "new":
      return {
        bytesConsumed: 0,
        periodByteQuota: libraryMonthlyQuota(transition.plan),
      };
    case "renew":
      return {
        bytesConsumed: 0,
        periodByteQuota: libraryMonthlyQuota(transition.plan),
      };
    case "upgrade":
      return {
        bytesConsumed: previous.bytesConsumed,
        periodByteQuota:
          previous.periodByteQuota +
          libraryQuotaDeltaOnUpgrade(transition.from, transition.to),
      };
    case "downgrade":
      return {
        bytesConsumed: previous.bytesConsumed,
        periodByteQuota: libraryMonthlyQuota(transition.to),
      };
    case "same":
      return {
        bytesConsumed: previous.bytesConsumed,
        periodByteQuota: previous.periodByteQuota,
      };
    case "cancel":
      return { bytesConsumed: 0, periodByteQuota: 0 };
  }
}
