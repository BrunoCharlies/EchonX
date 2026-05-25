"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase, trackViewBillingPage } from "@/lib/analytics/events";
import { getPlanById, type PlanTier } from "@/lib/plans";
import { LIBRARY_PLANS, type LibraryPlanTier } from "@/lib/billing/library-plans";
import { AI_ANALYSIS_PLAN } from "@/lib/billing/ai-plans";

type BillingPageAnalyticsProps = {
  fromXProfile?: boolean;
  fromFollow?: boolean;
  suggestedPlan?: PlanTier | null;
  suggestedLibraryPlan?: LibraryPlanTier | null;
  checkoutSuccess?: boolean;
  libraryCheckoutSuccess?: boolean;
  aiCheckoutSuccess?: boolean;
};

export function BillingPageAnalytics({
  fromXProfile,
  fromFollow,
  suggestedPlan,
  suggestedLibraryPlan,
  checkoutSuccess,
  libraryCheckoutSuccess,
  aiCheckoutSuccess,
}: BillingPageAnalyticsProps) {
  const searchParams = useSearchParams();
  const purchaseSent = useRef(false);

  useEffect(() => {
    const from = fromXProfile ? "x_profile" : fromFollow ? "follow" : undefined;
    trackViewBillingPage({
      from,
      suggested_plan: suggestedPlan ?? suggestedLibraryPlan ?? undefined,
    });
  }, [fromXProfile, fromFollow, suggestedPlan, suggestedLibraryPlan]);

  useEffect(() => {
    if (purchaseSent.current) return;
    const sessionId = searchParams.get("session_id") ?? undefined;

    if (checkoutSuccess) {
      purchaseSent.current = true;
      const plan = suggestedPlan ?? "starter";
      const tier = getPlanById(plan);
      trackPurchase({
        product: "audiopost",
        plan,
        transaction_id: sessionId,
        value: tier.priceUsd,
      });
      return;
    }

    if (libraryCheckoutSuccess) {
      purchaseSent.current = true;
      const plan = suggestedLibraryPlan ?? "library-starter";
      const tier = LIBRARY_PLANS.find((p) => p.id === plan);
      trackPurchase({
        product: "library",
        plan,
        transaction_id: sessionId,
        value: tier?.priceUsd,
      });
      return;
    }

    if (aiCheckoutSuccess) {
      purchaseSent.current = true;
      trackPurchase({
        product: "ai",
        plan: AI_ANALYSIS_PLAN.id,
        transaction_id: sessionId,
        value: AI_ANALYSIS_PLAN.priceUsd,
      });
    }
  }, [
    checkoutSuccess,
    libraryCheckoutSuccess,
    aiCheckoutSuccess,
    searchParams,
    suggestedPlan,
    suggestedLibraryPlan,
  ]);

  return null;
}
