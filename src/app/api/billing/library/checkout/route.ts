import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  STRIPE_BILLING_PRODUCT_LIBRARY,
  getStripePriceIdForLibraryPlan,
  isPaidLibraryPlan,
  isStripeLibraryBillingConfigured,
} from "@/lib/billing/stripe-config";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

function parseLibraryPlan(body: unknown): LibraryPlanTier | null {
  if (!body || typeof body !== "object") return null;
  const plan = (body as { plan?: string }).plan;
  if (
    plan === "library-starter" ||
    plan === "library-popular" ||
    plan === "library-pro"
  ) {
    return plan;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeLibraryBillingConfigured()) {
    return NextResponse.json(
      { error: "Library Stripe billing is not configured on this server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = parseLibraryPlan(body);
  if (!plan || !isPaidLibraryPlan(plan)) {
    return NextResponse.json({ error: "Invalid library plan" }, { status: 400 });
  }

  const priceId = getStripePriceIdForLibraryPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured for this plan" }, { status: 503 });
  }

  const supabase = await createClient();
  const ownerId = session.user.id;

  const [{ data: libraryRow }, { data: audiopostRow }] = await Promise.all([
    supabase
      .from("library_subscriptions")
      .select("stripe_customer_id")
      .eq("owner_x_user_id", ownerId)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("owner_x_user_id", ownerId)
      .maybeSingle(),
  ]);

  const existingCustomerId =
    (libraryRow?.stripe_customer_id as string | null)?.trim() ||
    (audiopostRow?.stripe_customer_id as string | null)?.trim() ||
    undefined;

  const stripe = getStripeServer();
  const origin = getAppOrigin();
  const billingUrl = `${origin}/app/settings/billing`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: existingCustomerId,
    customer_email: existingCustomerId ? undefined : session.user.email ?? undefined,
    client_reference_id: ownerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${billingUrl}?checkout=library-success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${billingUrl}?checkout=library-cancelled`,
    allow_promotion_codes: true,
    metadata: {
      billing_product: STRIPE_BILLING_PRODUCT_LIBRARY,
      owner_x_user_id: ownerId,
      plan_tier: plan,
    },
    subscription_data: {
      metadata: {
        billing_product: STRIPE_BILLING_PRODUCT_LIBRARY,
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
