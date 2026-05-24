import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  STRIPE_BILLING_PRODUCT_AI,
  getStripePriceIdForAiAnalysis,
  isStripeAiBillingConfigured,
} from "@/lib/billing/stripe-config";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeAiBillingConfigured()) {
    return NextResponse.json(
      { error: "AI Analysis Stripe billing is not configured on this server." },
      { status: 503 },
    );
  }

  const priceId = getStripePriceIdForAiAnalysis();
  if (!priceId) {
    return NextResponse.json({ error: "AI Analysis price is not configured." }, { status: 503 });
  }

  const supabase = await createClient();
  const ownerId = session.user.id;

  const [{ data: aiRow }, { data: libraryRow }, { data: audiopostRow }] = await Promise.all([
    supabase.from("ai_subscriptions").select("stripe_customer_id").eq("owner_x_user_id", ownerId).maybeSingle(),
    supabase.from("library_subscriptions").select("stripe_customer_id").eq("owner_x_user_id", ownerId).maybeSingle(),
    supabase.from("subscriptions").select("stripe_customer_id").eq("owner_x_user_id", ownerId).maybeSingle(),
  ]);

  const existingCustomerId =
    (aiRow?.stripe_customer_id as string | null)?.trim() ||
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
    success_url: `${billingUrl}?checkout=ai-success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${billingUrl}?checkout=ai-cancelled`,
    allow_promotion_codes: true,
    metadata: {
      billing_product: STRIPE_BILLING_PRODUCT_AI,
      owner_x_user_id: ownerId,
    },
    subscription_data: {
      metadata: {
        billing_product: STRIPE_BILLING_PRODUCT_AI,
        owner_x_user_id: ownerId,
      },
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
