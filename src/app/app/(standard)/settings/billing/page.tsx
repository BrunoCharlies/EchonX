import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BillingConversionPage } from "@/components/settings/billing-conversion-page";
import { loadLibraryEntitlement } from "@/lib/billing/library-entitlements";
import { loadAiEntitlement } from "@/lib/billing/ai-entitlements";
import {
  isStripeAiBillingConfigured,
  isStripeBillingConfigured,
  isStripeLibraryBillingConfigured,
} from "@/lib/billing/stripe-config";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { externalXLimitLabel, getPlanById, type PlanTier } from "@/lib/plans";
import { loadListeningPlanUsage } from "@/lib/billing/load-listening-usage";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{ plan?: string; from?: string; checkout?: string; library?: string }>;
};

function parseSuggestedPlan(value: string | undefined): PlanTier | null {
  if (value === "starter" || value === "popular" || value === "pro") return value;
  return null;
}

function parseSuggestedLibraryPlan(value: string | undefined): LibraryPlanTier | null {
  if (
    value === "library-starter" ||
    value === "library-popular" ||
    value === "library-pro"
  ) {
    return value;
  }
  return null;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/app/settings/billing");

  const params = await searchParams;
  const suggested = parseSuggestedPlan(params.plan);
  const suggestedLibrary = parseSuggestedLibraryPlan(params.library);
  const fromXProfile = params.from === "x_profile";
  const fromFollow = params.from === "follow";
  const billing = await loadListeningPlanUsage();
  const usage = billing.ok ? billing.usage : null;
  const active = usage ? getPlanById(usage.entitlement.effectivePlan) : getPlanById("free");

  const supabase = await createClient();
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("owner_x_user_id", session.user.id)
    .maybeSingle();

  const hasStripeCustomer = Boolean(
    (subRow?.stripe_customer_id as string | null)?.trim(),
  );

  let currentLibraryPlanId: LibraryPlanTier | null = null;
  let hasAiAnalysisPlan = false;
  try {
    const libraryEntitlement = await loadLibraryEntitlement(supabase, session.user.id);
    if (libraryEntitlement.plan && libraryEntitlement.fishActive) {
      currentLibraryPlanId = libraryEntitlement.plan;
    }
  } catch {
    currentLibraryPlanId = null;
  }

  try {
    const serviceSupabase = createServiceRoleClient();
    const aiEntitlement = await loadAiEntitlement(serviceSupabase, session.user.id);
    hasAiAnalysisPlan = aiEntitlement.plan === "ai-analysis";
  } catch {
    hasAiAnalysisPlan = false;
  }

  return (
    <BillingConversionPage
      currentPlanId={active.id}
      suggestedPlan={suggested}
      fromXProfile={fromXProfile}
      fromFollow={fromFollow}
      billingError={billing.ok ? null : billing.error}
      checkoutSuccess={params.checkout === "success"}
      checkoutCancelled={params.checkout === "cancelled"}
      libraryCheckoutSuccess={params.checkout === "library-success"}
      libraryCheckoutCancelled={params.checkout === "library-cancelled"}
      aiCheckoutSuccess={params.checkout === "ai-success"}
      aiCheckoutCancelled={params.checkout === "ai-cancelled"}
      hasAiAnalysisPlan={hasAiAnalysisPlan}
      aiStripeCheckoutEnabled={isStripeAiBillingConfigured()}
      stripeCheckoutEnabled={isStripeBillingConfigured()}
      libraryStripeCheckoutEnabled={isStripeLibraryBillingConfigured()}
      currentLibraryPlanId={currentLibraryPlanId}
      suggestedLibraryPlan={suggestedLibrary}
      hasStripeCustomer={hasStripeCustomer}
      usage={{
        activePlanName: active.name,
        externalXCount: usage?.externalXCount ?? 0,
        externalXMax: usage?.entitlement.maxExternalXProfiles ?? 0,
        limitLabel: usage?.limitLabel ?? externalXLimitLabel("free"),
        paidPlanExpired: usage?.entitlement.paidPlanExpired,
      }}
    />
  );
}
