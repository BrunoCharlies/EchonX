import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isLibraryFishQuotaExhausted,
  isLibraryPaidPeriodActive,
  libraryActionWhenQuotaExhausted,
  libraryBytesRemaining,
  type LibraryQuotaExhaustedAction,
  type LibrarySubscriptionSnapshot,
} from "@/lib/billing/library-quota-policy";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { formatSupabaseError } from "@/lib/billing/supabase-error";

export type LibraryEntitlement = LibrarySubscriptionSnapshot & {
  fishActive: boolean;
  paidPlanExpired: boolean;
  bytesRemaining: number | null;
  exhaustedAction: LibraryQuotaExhaustedAction | null;
};

export async function loadLibraryEntitlement(
  supabase: SupabaseClient,
  ownerXUserId: string,
): Promise<LibraryEntitlement> {
  const { data, error } = await supabase
    .from("library_subscriptions")
    .select("plan, bytes_consumed, period_byte_quota, current_period_end")
    .eq("owner_x_user_id", ownerXUserId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not load library subscription."));
  }

  const plan = (data?.plan as LibraryPlanTier | null) ?? null;
  const bytesConsumed = Number(data?.bytes_consumed ?? 0);
  const periodByteQuota = Number(data?.period_byte_quota ?? 0);
  const currentPeriodEnd = (data?.current_period_end as string | null) ?? null;

  const snapshot: LibrarySubscriptionSnapshot = {
    plan,
    bytesConsumed,
    periodByteQuota,
    currentPeriodEnd,
  };

  const periodActive = isLibraryPaidPeriodActive(plan, currentPeriodEnd);
  const fishActive = periodActive && plan !== null && !isLibraryFishQuotaExhausted(snapshot);

  return {
    ...snapshot,
    fishActive,
    paidPlanExpired: plan !== null && !periodActive,
    bytesRemaining: libraryBytesRemaining(snapshot),
    exhaustedAction:
      plan && periodActive && isLibraryFishQuotaExhausted(snapshot)
        ? libraryActionWhenQuotaExhausted(plan)
        : null,
  };
}
