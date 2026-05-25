import { trackGaEvent } from "@/lib/analytics/gtag";

/** Typed helpers for EchonX — names align with GA4 recommended events where possible. */

export function trackSignUp(method: "email" | "x" = "email") {
  trackGaEvent("sign_up", { method });
}

export function trackAddProfile(source: "audiopost_panel" | "listening_form" = "audiopost_panel") {
  trackGaEvent("add_profile", { source });
}

/** User opened Settings / Billing (checkout funnel entry). */
export function trackViewBillingPage(params?: {
  from?: string;
  suggested_plan?: string;
}) {
  trackGaEvent("view_billing_page", params);
}

/** User clicked a plan CTA before Stripe redirect. */
export function trackBeginCheckout(params: {
  product: "audiopost" | "library" | "ai";
  plan: string;
  value?: number;
  currency?: string;
}) {
  trackGaEvent("begin_checkout", {
    currency: params.currency ?? "USD",
    value: params.value,
    item_id: params.plan,
    item_category: params.product,
  });
}

/** Stripe success redirect — subscription activated (verify in Stripe dashboard). */
export function trackPurchase(params: {
  product: "audiopost" | "library" | "ai";
  plan?: string;
  transaction_id?: string;
  value?: number;
  currency?: string;
}) {
  trackGaEvent("purchase", {
    currency: params.currency ?? "USD",
    value: params.value,
    transaction_id: params.transaction_id,
    item_category: params.product,
    item_id: params.plan,
  });
}
