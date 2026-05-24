import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STRIPE_BILLING_PRODUCT_LIBRARY,
  libraryPlanTierFromStripePriceId,
} from "@/lib/billing/stripe-config";
import {
  applyLibraryPlanTransition,
  detectLibraryPlanTransition,
} from "@/lib/billing/library-quota-policy";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import { getStripeServer } from "@/lib/stripe/server";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function primaryPriceId(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  const price = item?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

function periodTimestamp(subscription: Stripe.Subscription, field: "start" | "end"): string | null {
  const item = subscription.items.data[0];
  const unix =
    field === "end"
      ? (item?.current_period_end ??
        (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end)
      : (item?.current_period_start ??
        (subscription as Stripe.Subscription & { current_period_start?: number })
          .current_period_start);
  if (!unix) return null;
  return new Date(unix * 1000).toISOString();
}

function isLibraryStripeSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.metadata?.billing_product === STRIPE_BILLING_PRODUCT_LIBRARY;
}

function planFromLibrarySubscription(
  subscription: Stripe.Subscription,
): LibraryPlanTier | null {
  const fromMeta = subscription.metadata?.plan_tier;
  if (
    fromMeta === "library-starter" ||
    fromMeta === "library-popular" ||
    fromMeta === "library-pro"
  ) {
    return fromMeta;
  }
  return libraryPlanTierFromStripePriceId(primaryPriceId(subscription));
}

export async function resolveLibraryOwnerXUserId(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  fallback?: string | null,
): Promise<string | null> {
  const meta =
    subscription.metadata?.owner_x_user_id?.trim() ||
    fallback?.trim() ||
    null;
  if (meta) return meta;

  const customerId = stripeCustomerId(subscription.customer);
  if (!customerId) return null;

  const { data, error } = await supabase
    .from("library_subscriptions")
    .select("owner_x_user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not resolve library subscription owner."));
  }
  return (data?.owner_x_user_id as string | undefined) ?? null;
}

async function cancelSupersededLibrarySubscription(
  previousStripeSubscriptionId: string | null | undefined,
  nextStripeSubscriptionId: string,
): Promise<void> {
  const prev = previousStripeSubscriptionId?.trim();
  if (!prev || prev === nextStripeSubscriptionId) return;
  try {
    const stripe = getStripeServer();
    await stripe.subscriptions.cancel(prev);
  } catch (err) {
    console.warn("[stripe library] could not cancel previous subscription", prev, err);
  }
}

export async function upsertLibrarySubscriptionFromStripe(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  ownerHint?: string | null,
): Promise<void> {
  if (!isLibraryStripeSubscription(subscription)) return;

  const ownerXUserId = await resolveLibraryOwnerXUserId(supabase, subscription, ownerHint);
  if (!ownerXUserId) {
    console.warn("[stripe library] sync skipped: unknown owner", subscription.id);
    return;
  }

  const active = ACTIVE_STATUSES.has(subscription.status);
  const nextPlan = active ? planFromLibrarySubscription(subscription) : null;
  const periodEnd = active ? periodTimestamp(subscription, "end") : null;
  const periodStart = active ? periodTimestamp(subscription, "start") : null;
  const customerId = stripeCustomerId(subscription.customer);

  const { data: existing, error: readErr } = await supabase
    .from("library_subscriptions")
    .select("plan, bytes_consumed, period_byte_quota, current_period_end, stripe_subscription_id")
    .eq("owner_x_user_id", ownerXUserId)
    .maybeSingle();

  if (readErr) {
    throw new Error(formatSupabaseError(readErr, "Could not read library subscription."));
  }

  const previousPlan = (existing?.plan as LibraryPlanTier | null) ?? null;
  const previousPeriodEnd = (existing?.current_period_end as string | null) ?? null;
  const periodRenewed = Boolean(
    active &&
      nextPlan &&
      previousPeriodEnd &&
      periodEnd &&
      previousPeriodEnd !== periodEnd &&
      previousPlan === nextPlan,
  );

  const transition = detectLibraryPlanTransition(previousPlan, nextPlan, periodRenewed);
  const quotas = applyLibraryPlanTransition(transition, {
    bytesConsumed: Number(existing?.bytes_consumed ?? 0),
    periodByteQuota: Number(existing?.period_byte_quota ?? 0),
  });

  if (active && subscription.id) {
    await cancelSupersededLibrarySubscription(
      existing?.stripe_subscription_id as string | undefined,
      subscription.id,
    );
  }

  const row = active && nextPlan
    ? {
        owner_x_user_id: ownerXUserId,
        plan: nextPlan,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        bytes_consumed: quotas.bytesConsumed,
        period_byte_quota: quotas.periodByteQuota,
        updated_at: new Date().toISOString(),
      }
    : {
        owner_x_user_id: ownerXUserId,
        plan: null,
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        bytes_consumed: 0,
        period_byte_quota: 0,
        updated_at: new Date().toISOString(),
      };

  const { error: upsertErr } = await supabase
    .from("library_subscriptions")
    .upsert(row as Record<string, unknown>, { onConflict: "owner_x_user_id" });

  if (upsertErr) {
    throw new Error(formatSupabaseError(upsertErr, "Could not update library subscription."));
  }
}
