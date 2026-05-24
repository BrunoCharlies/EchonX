import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppOrigin } from "@/lib/env";
import {
  STRIPE_BILLING_PRODUCT_AUDIOPOST,
  getStripePriceIdForPlan,
  isPaidAudiopostPlan,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe-config";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";
import type { PlanTier } from "@/lib/plans";

export const runtime = "nodejs";

function parsePlan(body: unknown): PlanTier | null {
  if (!body || typeof body !== "object") return null;
  const plan = (body as { plan?: string }).plan;
  if (plan === "starter" || plan === "popular" || plan === "pro") return plan;
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeBillingConfigured()) {
    return NextResponse.json(
      { error: "Stripe billing is not configured on this server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = parsePlan(body);
  if (!plan || !isPaidAudiopostPlan(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = getStripePriceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured for this plan" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("owner_x_user_id", session.user.id)
    .maybeSingle();

  const stripe = getStripeServer();
  const origin = getAppOrigin();
  const ownerId = session.user.id;
  const billingUrl = `${origin}/app/settings/billing`;

  const existingCustomerId = (subRow?.stripe_customer_id as string | null)?.trim() || undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingCustomerId,
    customer_email: existingCustomerId ? undefined : session.user.email ?? undefined,
    client_reference_id: ownerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${billingUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${billingUrl}?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      billing_product: STRIPE_BILLING_PRODUCT_AUDIOPOST,
      owner_x_user_id: ownerId,
      plan_tier: plan,
    },
    subscription_data: {
      metadata: {
        billing_product: STRIPE_BILLING_PRODUCT_AUDIOPOST,
        owner_x_user_id: ownerId,
        plan_tier: plan,
      },
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
