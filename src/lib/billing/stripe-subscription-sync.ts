import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  STRIPE_BILLING_PRODUCT_AUDIOPOST,
  planTierFromStripePriceId,
} from "@/lib/billing/stripe-config";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import type { PlanTier } from "@/lib/plans";

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

function planFromSubscription(subscription: Stripe.Subscription): PlanTier | null {
  const fromMeta = subscription.metadata?.plan_tier;
  if (fromMeta === "starter" || fromMeta === "popular" || fromMeta === "pro") {
    return fromMeta;
  }
  return planTierFromStripePriceId(primaryPriceId(subscription));
}

function periodEndIso(subscription: Stripe.Subscription): string | null {
  const end =
    subscription.items.data[0]?.current_period_end ??
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

export async function resolveOwnerXUserId(
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
    .from("subscriptions")
    .select("owner_x_user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not resolve subscription owner."));
  }
  return (data?.owner_x_user_id as string | undefined) ?? null;
}

export async function upsertSubscriptionFromStripe(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  ownerHint?: string | null,
): Promise<void> {
  const product = subscription.metadata?.billing_product;
  if (product && product !== STRIPE_BILLING_PRODUCT_AUDIOPOST) return;

  const ownerXUserId = await resolveOwnerXUserId(supabase, subscription, ownerHint);
  if (!ownerXUserId) {
    console.warn("[stripe] subscription sync skipped: unknown owner", subscription.id);
    return;
  }

  const paidPlan = planFromSubscription(subscription);
  const active = ACTIVE_STATUSES.has(subscription.status);
  const plan: PlanTier = active && paidPlan ? paidPlan : "free";
  const currentPeriodEnd = active ? periodEndIso(subscription) : null;
  const customerId = stripeCustomerId(subscription.customer);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      owner_x_user_id: ownerXUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "owner_x_user_id" },
  );

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not update subscription from Stripe."));
  }
}
