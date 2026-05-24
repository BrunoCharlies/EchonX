import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertAiSubscriptionFromStripe } from "@/lib/billing/ai-stripe-sync";
import { upsertLibrarySubscriptionFromStripe } from "@/lib/billing/library-stripe-sync";
import { upsertSubscriptionFromStripe } from "@/lib/billing/stripe-subscription-sync";
import {
  STRIPE_BILLING_PRODUCT_AI,
  STRIPE_BILLING_PRODUCT_LIBRARY,
} from "@/lib/billing/stripe-config";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

const HANDLED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

async function dispatchSubscriptionEvent(
  supabase: ReturnType<typeof createServiceRoleClient>,
  subscription: Stripe.Subscription,
  ownerHint?: string | null,
) {
  const product = subscription.metadata?.billing_product;
  if (product === STRIPE_BILLING_PRODUCT_LIBRARY) {
    await upsertLibrarySubscriptionFromStripe(supabase, subscription, ownerHint);
    return;
  }
  await upsertSubscriptionFromStripe(supabase, subscription, ownerHint);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is missing — run npm run stripe:use-test and restart dev");
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 500 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripeServer();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe is not configured";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    console.error("[stripe webhook] signature:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server billing storage is not configured";
    console.error("[stripe webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode !== "subscription") break;

        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id;

        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const ownerHint =
          checkoutSession.client_reference_id ??
          checkoutSession.metadata?.owner_x_user_id ??
          null;

        const product =
          checkoutSession.metadata?.billing_product ??
          subscription.metadata?.billing_product;

        if (product === STRIPE_BILLING_PRODUCT_LIBRARY) {
          await upsertLibrarySubscriptionFromStripe(supabase, subscription, ownerHint);
        } else if (product === STRIPE_BILLING_PRODUCT_AI) {
          await upsertAiSubscriptionFromStripe(supabase, subscription, ownerHint);
        } else {
          await upsertSubscriptionFromStripe(supabase, subscription, ownerHint);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await dispatchSubscriptionEvent(supabase, subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[stripe webhook]", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
