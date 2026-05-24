import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STRIPE_BILLING_PRODUCT_AI } from "@/lib/billing/stripe-config";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import { getStripeServer } from "@/lib/stripe/server";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function periodTimestamp(subscription: Stripe.Subscription, field: "start" | "end"): string | null {
  const item = subscription.items.data[0];
  const unix =
    field === "end"
      ? (item?.current_period_end ??
        (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end)
      : (item?.current_period_start ??
        (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start);
  if (!unix) return null;
  return new Date(unix * 1000).toISOString();
}

export function isAiStripeSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.metadata?.billing_product === STRIPE_BILLING_PRODUCT_AI;
}

export async function resolveAiOwnerXUserId(
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
    .from("ai_subscriptions")
    .select("owner_x_user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not resolve AI subscription owner."));
  }
  return (data?.owner_x_user_id as string | undefined) ?? null;
}

async function cancelSupersededAiSubscription(
  previousStripeSubscriptionId: string | null | undefined,
  nextStripeSubscriptionId: string,
): Promise<void> {
  const prev = previousStripeSubscriptionId?.trim();
  if (!prev || prev === nextStripeSubscriptionId) return;
  try {
    const stripe = getStripeServer();
    await stripe.subscriptions.cancel(prev);
  } catch (err) {
    console.warn("[stripe ai] could not cancel previous subscription", prev, err);
  }
}

export async function upsertAiSubscriptionFromStripe(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  ownerHint?: string | null,
): Promise<void> {
  if (!isAiStripeSubscription(subscription)) return;

  const ownerXUserId = await resolveAiOwnerXUserId(supabase, subscription, ownerHint);
  if (!ownerXUserId) {
    console.warn("[stripe ai] sync skipped: unknown owner", subscription.id);
    return;
  }

  const active = ACTIVE_STATUSES.has(subscription.status);
  const periodEnd = active ? periodTimestamp(subscription, "end") : null;
  const periodStart = active ? periodTimestamp(subscription, "start") : null;
  const customerId = stripeCustomerId(subscription.customer);

  const { data: existing, error: readErr } = await supabase
    .from("ai_subscriptions")
    .select("stripe_subscription_id")
    .eq("owner_x_user_id", ownerXUserId)
    .maybeSingle();

  if (readErr) {
    throw new Error(formatSupabaseError(readErr, "Could not read AI subscription."));
  }

  if (active && subscription.id) {
    await cancelSupersededAiSubscription(
      existing?.stripe_subscription_id as string | undefined,
      subscription.id,
    );
  }

  const row = active
    ? {
        owner_x_user_id: ownerXUserId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }
    : {
        owner_x_user_id: ownerXUserId,
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      };

  const { error: upsertErr } = await supabase
    .from("ai_subscriptions")
    .upsert(row as Record<string, unknown>, { onConflict: "owner_x_user_id" });

  if (upsertErr) {
    throw new Error(formatSupabaseError(upsertErr, "Could not update AI subscription."));
  }
}
