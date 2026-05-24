import { isFreeOfficialFollowProfile } from "@/lib/curator/official-profiles";
import {
  canAddCustomExternalXAccounts,
  maxExternalXProfilesForPlan,
  type PlanTier,
} from "@/lib/plans";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUserRole = "user" | "admin";

export function isAdminUserRole(role: string | null | undefined): role is "admin" {
  return role === "admin";
}

/** Admins may add custom external X profiles without a paid subscription. */
export function canAddCustomExternalXAccountsForUser(
  plan: PlanTier,
  role?: string | null,
): boolean {
  if (isAdminUserRole(role)) return true;
  return canAddCustomExternalXAccounts(plan);
}

export function maxExternalXProfilesForUser(plan: PlanTier, role?: string | null): number | null {
  if (isAdminUserRole(role)) return null;
  return maxExternalXProfilesForPlan(plan);
}

export type ProfileFollowTarget = {
  kind?: string | null;
  owner_x_user_id?: string | null;
  username?: string | null;
};

/** Custom X slots only — excludes official @qubic / News curator channels. */
export function isBillableExternalXProfile(target: ProfileFollowTarget): boolean {
  if (target.kind !== "external_x") return false;
  return !isFreeOfficialFollowProfile(target);
}

export type UserEntitlement = {
  plan: PlanTier;
  effectivePlan: PlanTier;
  maxExternalXProfiles: number | null;
  currentPeriodEnd: string | null;
  paidPlanExpired: boolean;
};

export type PlanLimitViolation = {
  code: "PLAN_LIMIT";
  message: string;
  upgradeUrl: string;
  limit: number;
  current: number;
  plan: PlanTier;
  suggestedPlan: PlanTier;
};

export function isPaidPlanPeriodActive(plan: PlanTier, currentPeriodEnd: string | null): boolean {
  if (plan === "free") return true;
  if (!currentPeriodEnd) return false;
  return new Date(currentPeriodEnd) > new Date();
}

export function effectivePlanTier(plan: PlanTier, currentPeriodEnd: string | null): PlanTier {
  if (plan === "free") return "free";
  return isPaidPlanPeriodActive(plan, currentPeriodEnd) ? plan : "free";
}

export function buildEntitlement(plan: PlanTier, currentPeriodEnd: string | null): UserEntitlement {
  const effectivePlan = effectivePlanTier(plan, currentPeriodEnd);
  return {
    plan,
    effectivePlan,
    maxExternalXProfiles: maxExternalXProfilesForPlan(effectivePlan),
    currentPeriodEnd,
    paidPlanExpired: plan !== "free" && effectivePlan === "free",
  };
}

export function suggestUpgradePlan(currentExternalCount: number): PlanTier {
  if (currentExternalCount < 3) return "starter";
  if (currentExternalCount < 5) return "popular";
  return "pro";
}

export function billingUpgradeUrl(suggestedPlan: PlanTier, from?: "x_profile" | "follow"): string {
  const params = new URLSearchParams({ plan: suggestedPlan });
  if (from) params.set("from", from);
  return `/app/settings/billing?${params.toString()}`;
}

export function planLimitMessage(limit: number, plan: PlanTier): string {
  if (plan === "free" || limit === 0) {
    return "Free includes official @qubic on X and unlimited native EchonX profiles. Upgrade to Starter to add other X accounts.";
  }
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `Your ${planLabel} plan allows ${limit} external X profile${limit === 1 ? "" : "s"}. Upgrade to add more.`;
}

/** Rows in want_to_hear whose target profile is external_x. */
export async function countExternalXListeningProfiles(
  supabase: SupabaseClient,
  listenerXUserId: string,
): Promise<number> {
  const { data: follows, error: followsErr } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", listenerXUserId);

  if (followsErr) {
    throw new Error(
      formatSupabaseError(followsErr, "Could not load your followed profiles."),
    );
  }

  const ids = (follows ?? [])
    .map((row) => row.target_profile_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!ids.length) return 0;

  const { data: profiles, error: countErr } = await supabase
    .from("profiles")
    .select("id, kind, owner_x_user_id, username")
    .in("id", ids);

  if (countErr) {
    throw new Error(
      formatSupabaseError(countErr, "Could not count external X profiles."),
    );
  }
  return (profiles ?? []).filter((row) =>
    isBillableExternalXProfile({
      kind: row.kind as string | null,
      owner_x_user_id: row.owner_x_user_id as string | null,
      username: row.username as string | null,
    }),
  ).length;
}

/** Ensures a free row exists (native email users may lack one until profile setup). */
export async function ensureSubscriptionRow(
  supabase: SupabaseClient,
  ownerXUserId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("owner_x_user_id")
    .eq("owner_x_user_id", ownerXUserId)
    .limit(1);

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not read subscription."));
  }
  if (data?.length) return;

  const { error: insertErr } = await supabase.from("subscriptions").upsert(
    { owner_x_user_id: ownerXUserId, plan: "free" },
    { onConflict: "owner_x_user_id" },
  );
  if (insertErr) {
    throw new Error(formatSupabaseError(insertErr, "Could not create subscription row."));
  }
}

export async function loadUserEntitlement(
  supabase: SupabaseClient,
  ownerXUserId: string,
): Promise<UserEntitlement> {
  await ensureSubscriptionRow(supabase, ownerXUserId);

  const { data: rows, error } = await supabase
    .from("subscriptions")
    .select("plan, current_period_end")
    .eq("owner_x_user_id", ownerXUserId)
    .limit(1);

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not load subscription."));
  }

  const row = rows?.[0];
  const plan = (row?.plan as PlanTier | undefined) ?? "free";
  const currentPeriodEnd = (row?.current_period_end as string | null) ?? null;
  return buildEntitlement(plan, currentPeriodEnd);
}

export async function assertCanFollowExternalXProfile(input: {
  supabase: SupabaseClient;
  listenerXUserId: string;
  targetProfileId: string;
  entitlement?: UserEntitlement;
  /** profiles.role = admin bypasses paid-plan limits for custom external X. */
  role?: string | null;
}): Promise<PlanLimitViolation | null> {
  if (isAdminUserRole(input.role)) return null;

  const { supabase, listenerXUserId, targetProfileId } = input;
  const entitlement = input.entitlement ?? (await loadUserEntitlement(supabase, listenerXUserId));
  const max = maxExternalXProfilesForUser(entitlement.effectivePlan, input.role);
  if (max === null) return null;

  const { data: existingFollow } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", listenerXUserId)
    .eq("target_profile_id", targetProfileId)
    .maybeSingle();

  if (existingFollow) return null;

  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("kind, owner_x_user_id, username")
    .eq("id", targetProfileId)
    .maybeSingle();

  if (targetErr) {
    throw new Error(formatSupabaseError(targetErr, "Could not load profile."));
  }

  const targetRow: ProfileFollowTarget = {
    kind: target?.kind as string | null,
    owner_x_user_id: target?.owner_x_user_id as string | null,
    username: target?.username as string | null,
  };

  if (!isBillableExternalXProfile(targetRow)) return null;

  const plan = entitlement.effectivePlan;
  if (!canAddCustomExternalXAccountsForUser(plan, input.role)) {
    return {
      code: "PLAN_LIMIT",
      message: planLimitMessage(0, "free"),
      upgradeUrl: billingUpgradeUrl("starter", "follow"),
      limit: 0,
      current: await countExternalXListeningProfiles(supabase, listenerXUserId),
      plan,
      suggestedPlan: "starter",
    };
  }

  const current = await countExternalXListeningProfiles(supabase, listenerXUserId);
  if (max !== null && current < max) return null;

  const suggestedPlan = suggestUpgradePlan(current);
  return {
    code: "PLAN_LIMIT",
    message: planLimitMessage(max ?? current, plan),
    upgradeUrl: billingUpgradeUrl(suggestedPlan, "follow"),
    limit: max ?? current,
    current,
    plan,
    suggestedPlan,
  };
}

/** Native + official channels (Qubic/News): free to listen. Custom external_x: paid plans only. */
export function canListenToAudiopostAuthorWithPlan(
  profile: ProfileFollowTarget,
  effectivePlan: PlanTier,
): boolean {
  if (profile.kind === "native" || profile.kind === "curator") return true;
  if (isFreeOfficialFollowProfile(profile)) return true;
  if (profile.kind === "external_x") return canAddCustomExternalXAccounts(effectivePlan);
  return true;
}

export function audiopostListenBlockedMessage(effectivePlan: PlanTier): string {
  if (effectivePlan === "free") {
    return "Free includes native EchonX and official @qubic. Upgrade to Starter to listen to other X profiles.";
  }
  return "Upgrade your plan to listen to this profile.";
}
