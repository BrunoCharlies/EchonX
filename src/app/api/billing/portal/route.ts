import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("owner_x_user_id", session.user.id)
    .maybeSingle();

  const customerId = (subRow?.stripe_customer_id as string | null)?.trim();
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file. Subscribe to a plan first." },
      { status: 400 },
    );
  }

  const stripe = getStripeServer();
  const origin = getAppOrigin();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/app/settings/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
