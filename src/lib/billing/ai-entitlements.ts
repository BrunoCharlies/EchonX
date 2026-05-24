import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AI_VERIFICATION_FREE_DAILY,
  type AiVerificationPlan,
  dailyLimitForPlan,
  startOfUtcDayIso,
} from "@/lib/ai/verification-limits";
import { formatSupabaseError } from "@/lib/billing/supabase-error";

export type AiEntitlement = {
  plan: AiVerificationPlan;
  dailyLimit: number;
  /** OpenAI calls today only (logs with cache_hit = false). Cached post reads do not increment. */
  dailyUsed: number;
  paidPlanExpired: boolean;
};

function isAiPeriodActive(periodEnd: string | null): boolean {
  if (!periodEnd) return false;
  return new Date(periodEnd).getTime() > Date.now();
}

export async function loadAiEntitlement(
  supabase: SupabaseClient,
  ownerXUserId: string,
): Promise<AiEntitlement> {
  const dayStart = startOfUtcDayIso();

  const [{ data: sub }, { count, error: countErr }] = await Promise.all([
    supabase
      .from("ai_subscriptions")
      .select("current_period_end")
      .eq("owner_x_user_id", ownerXUserId)
      .maybeSingle(),
    supabase
      .from("ai_verification_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerXUserId)
      .eq("cache_hit", false)
      .gte("created_at", dayStart),
  ]);

  if (countErr) {
    throw new Error(formatSupabaseError(countErr, "Could not load AI verification usage."));
  }

  const periodEnd = (sub?.current_period_end as string | null) ?? null;
  const paidActive = isAiPeriodActive(periodEnd);
  const plan: AiVerificationPlan = paidActive ? "ai-analysis" : "free";

  return {
    plan,
    dailyLimit: dailyLimitForPlan(plan),
    dailyUsed: count ?? 0,
    paidPlanExpired: Boolean(periodEnd && !paidActive),
  };
}

export function aiVerificationRemaining(entitlement: AiEntitlement): number {
  return Math.max(0, entitlement.dailyLimit - entitlement.dailyUsed);
}

export function aiFreeLimitExceeded(entitlement: AiEntitlement): boolean {
  return entitlement.plan === "free" && entitlement.dailyUsed >= AI_VERIFICATION_FREE_DAILY;
}
