"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BookOpen,
  Check,
  CreditCard,
  Headphones,
  Mic,
  Minus,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BILLING_COMPARISON_ROWS,
  BILLING_FAQ,
  type ComparisonCell,
} from "@/lib/billing/plan-comparison";
import { LIBRARY_PLANS } from "@/lib/billing/library-plans";
import { AI_ANALYSIS_PLAN } from "@/lib/billing/ai-plans";
import { AiBillingCheckoutButton } from "@/components/settings/ai-billing-checkout-button";
import { BillingCheckoutButton } from "@/components/settings/billing-checkout-button";
import { BillingCheckoutSuccess } from "@/components/settings/billing-checkout-success";
import { BillingPortalButton } from "@/components/settings/billing-portal-button";
import { LibraryBillingCheckoutButton } from "@/components/settings/library-billing-checkout-button";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";
import { PLANS, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

type UsageProps = {
  activePlanName: string;
  externalXCount: number;
  externalXMax: number | null;
  limitLabel: string;
  paidPlanExpired?: boolean;
};

type BillingConversionPageProps = {
  usage: UsageProps;
  suggestedPlan: PlanTier | null;
  fromXProfile: boolean;
  fromFollow: boolean;
  billingError?: string | null;
  currentPlanId: PlanTier;
  checkoutSuccess?: boolean;
  checkoutCancelled?: boolean;
  stripeCheckoutEnabled?: boolean;
  hasStripeCustomer?: boolean;
  currentLibraryPlanId?: LibraryPlanTier | null;
  suggestedLibraryPlan?: LibraryPlanTier | null;
  libraryStripeCheckoutEnabled?: boolean;
  libraryCheckoutSuccess?: boolean;
  libraryCheckoutCancelled?: boolean;
  hasAiAnalysisPlan?: boolean;
  aiStripeCheckoutEnabled?: boolean;
  aiCheckoutSuccess?: boolean;
  aiCheckoutCancelled?: boolean;
};

function ComparisonCellIcon({ value }: { value: ComparisonCell }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="Not included" />;
  }
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

function HeroVisual() {
  return (
    <div className="relative mx-auto flex h-[220px] w-full max-w-[320px] items-center justify-center sm:h-[260px]">
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute h-48 w-48 rounded-full border border-primary/20" />
      <div className="absolute h-64 w-64 rounded-full border border-violet-500/10" />
      <div className="relative z-10 w-[200px] rotate-[-8deg] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 shadow-2xl shadow-primary/25">
        <div className="mb-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>EchonX</span>
          <Headphones className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex h-16 items-end justify-center gap-1">
          {[40, 65, 35, 80, 50, 70, 45, 90, 55].map((h, i) => (
            <div
              key={i}
              className="w-2 rounded-full bg-gradient-to-t from-primary/40 to-cyan-400"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
            <X className="h-4 w-4" />
          </div>
        </div>
      </div>
      <Mic className="absolute right-4 top-8 h-5 w-5 text-primary/80" />
      <Shield className="absolute bottom-10 left-2 h-5 w-5 text-violet-400/80" />
      <Sparkles className="absolute right-8 bottom-16 h-4 w-4 text-cyan-300/70" />
    </div>
  );
}

export type PricingCardPlan = {
  name: string;
  priceUsd: number;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  highlighted?: boolean;
};

function PlanPricingCard({
  plan,
  planId,
  libraryPlanId,
  isCurrent,
  isSuggested,
  checkoutDisabled = false,
  stripeCheckoutEnabled = false,
  libraryStripeCheckoutEnabled = false,
  disabledLabel = "Current plan",
}: {
  plan: PricingCardPlan;
  planId?: PlanTier;
  libraryPlanId?: LibraryPlanTier;
  isCurrent: boolean;
  isSuggested: boolean;
  checkoutDisabled?: boolean;
  stripeCheckoutEnabled?: boolean;
  libraryStripeCheckoutEnabled?: boolean;
  disabledLabel?: string;
}) {
  const displayMonthly = plan.priceUsd;
  const highlighted = plan.highlighted || isSuggested;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card/80 p-6 backdrop-blur-sm transition-shadow",
        highlighted
          ? "border-violet-500/50 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/30"
          : "border-border/70 hover:border-border",
        isCurrent && "ring-1 ring-emerald-500/40",
      )}
    >
      {plan.badge ? (
        <Badge
          variant="popular"
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-wide"
        >
          {plan.badge}
        </Badge>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        <p className="min-h-[48px] text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">${displayMonthly}</span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>
      <p className="text-xs text-muted-foreground">Billed monthly</p>
      <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {libraryStripeCheckoutEnabled && libraryPlanId && !checkoutDisabled ? (
        <LibraryBillingCheckoutButton
          planId={libraryPlanId}
          disabled={isCurrent}
          highlighted={highlighted}
          label={
            isCurrent
              ? disabledLabel
              : `Start for $${displayMonthly} / month`
          }
        />
      ) : stripeCheckoutEnabled && planId && !checkoutDisabled ? (
        <BillingCheckoutButton
          planId={planId}
          disabled={isCurrent}
          highlighted={highlighted}
          label={
            isCurrent
              ? disabledLabel
              : `Start for $${displayMonthly} / month`
          }
        />
      ) : (
        <Button
          disabled={isCurrent || checkoutDisabled}
          className={cn(
            "mt-6 w-full",
            highlighted
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
              : "bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-600/90",
          )}
          size="lg"
        >
          {isCurrent ? disabledLabel : checkoutDisabled ? "Coming soon" : `Start for $${displayMonthly} / month`}
        </Button>
      )}
    </div>
  );
}

export function BillingConversionPage({
  usage,
  suggestedPlan,
  fromXProfile,
  fromFollow,
  billingError,
  currentPlanId,
  checkoutSuccess = false,
  checkoutCancelled = false,
  stripeCheckoutEnabled = false,
  hasStripeCustomer = false,
  currentLibraryPlanId = null,
  suggestedLibraryPlan = null,
  libraryStripeCheckoutEnabled = false,
  libraryCheckoutSuccess = false,
  libraryCheckoutCancelled = false,
  hasAiAnalysisPlan = false,
  aiStripeCheckoutEnabled = false,
  aiCheckoutSuccess = false,
  aiCheckoutCancelled = false,
}: BillingConversionPageProps) {
  const paidPlans = useMemo(() => PLANS.filter((p) => p.id !== "free"), []);

  return (
    <div className="space-y-16 pb-20">
      <BillingCheckoutSuccess show={checkoutSuccess || libraryCheckoutSuccess || aiCheckoutSuccess} />
      {checkoutCancelled || libraryCheckoutCancelled ? (
        <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Checkout cancelled. You can pick a plan anytime.
        </p>
      ) : null}
      {hasStripeCustomer ? (
        <div className="flex justify-end">
          <BillingPortalButton />
        </div>
      ) : null}
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-background to-background px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        <p className="text-sm text-muted-foreground">
          <Link href="/app/settings" className="hover:text-foreground">
            Settings
          </Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">Billing</span>
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Plans that scale{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                with your voice
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              External X listening limits follow your plan. Stripe checkout. Cancel anytime.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-primary" />
                Official @qubic on X — unlimited native EchonX
              </li>
              <li className="flex items-center gap-3">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                Paid plans unlock custom external X accounts
              </li>
              <li className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                Secure payments by Stripe
              </li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {billingError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {billingError}
        </p>
      ) : null}

      {/* Usage */}
      <section className="rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8">
        <h2 className="text-lg font-semibold">Your usage</h2>
        <p className="mt-1 text-sm text-muted-foreground">Native EchonX profiles stay unlimited.</p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium text-foreground">Active plan:</span> {usage.activePlanName}
            {usage.paidPlanExpired ? (
              <Badge variant="outline" className="ml-2 text-[10px]">
                Expired
              </Badge>
            ) : null}
          </p>
          <p>
            <span className="font-medium text-foreground">External X profiles:</span>{" "}
            {usage.externalXCount}
            {usage.externalXMax != null ? ` / ${usage.externalXMax}` : ""}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{usage.limitLabel}</p>
      </section>

      {/* Upgrade alert */}
      {fromXProfile || fromFollow ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="text-sm">
              {fromXProfile ? (
                <p>
                  Adding external X profiles requires a paid plan. Free includes official <strong>@qubic</strong> and
                  unlimited native EchonX profiles.
                </p>
              ) : (
                <p>Following this X profile requires a paid plan. Free keeps @qubic and native profiles.</p>
              )}
            </div>
          </div>
          <p className="text-sm font-medium text-primary sm:text-right">Choose a plan below to follow voices on X.</p>
        </section>
      ) : null}

      <section id="plan-cards" className="flex flex-col items-center gap-4 scroll-mt-8">
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-2 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight">Audiopost plans</h2>
            <p className="text-sm text-muted-foreground">
              Queue, Now Playing, and custom X profiles. Paid tiers include Fish voice for your feed.
            </p>
          </div>
          <div className="grid w-full gap-6 lg:grid-cols-3">
            {paidPlans.map((plan) => (
              <PlanPricingCard
                key={plan.id}
                plan={plan}
                planId={plan.id}
                isCurrent={currentPlanId === plan.id}
                isSuggested={suggestedPlan === plan.id}
                stripeCheckoutEnabled={stripeCheckoutEnabled}
              />
            ))}
          </div>
        </div>

        <div id="library-premium" className="w-full scroll-mt-8 space-y-4 border-t border-border/60 pt-12">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Library Premium</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Add-on for the book library and PDF reader—separate from Audiopost. <strong className="font-medium text-foreground">Free:</strong> unlimited listening with your browser voice (Web Speech).{" "}
                <strong className="font-medium text-foreground">Paid:</strong> Fish S2 Pro with a monthly allowance; run out mid-cycle → upgrade to a higher tier; on Pro, wait for the next Stripe renewal.
              </p>
            </div>
          </div>
          <div className="grid w-full gap-6 lg:grid-cols-3">
            {LIBRARY_PLANS.map((plan) => (
              <PlanPricingCard
                key={plan.id}
                plan={plan}
                libraryPlanId={plan.id}
                isCurrent={currentLibraryPlanId === plan.id}
                isSuggested={
                  suggestedLibraryPlan === plan.id || (plan.highlighted ?? false)
                }
                checkoutDisabled={!libraryStripeCheckoutEnabled}
                libraryStripeCheckoutEnabled={libraryStripeCheckoutEnabled}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Listening times are estimates (~1,000 characters per minute of narration). Allowance resets each billing
            month and does not roll over. If you use all hours before renewal, you can upgrade to a higher Library plan
            for more time this cycle—Library Pro has no add-on hours; wait for the next cycle.
          </p>
        </div>

        <div
          id="ai-plan"
          className="w-full scroll-mt-8 space-y-4 border-t border-border/60 pt-12"
        >
          <div className="flex flex-col gap-4 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/5 via-card/80 to-cyan-500/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                <ShieldCheck className="h-6 w-6 text-violet-400" />
              </div>
              <div className="min-w-0 space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">{AI_ANALYSIS_PLAN.name}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{AI_ANALYSIS_PLAN.description}</p>
                <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                  {AI_ANALYSIS_PLAN.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:min-w-[200px] sm:items-end">
              <div className="text-left sm:text-right">
                <p className="text-3xl font-semibold tracking-tight">${AI_ANALYSIS_PLAN.priceUsd}</p>
                <p className="text-sm text-muted-foreground">/ month · recurring</p>
              </div>
              {hasAiAnalysisPlan ? (
                <Button disabled className="w-full sm:w-auto" size="lg">
                  Current plan
                </Button>
              ) : aiStripeCheckoutEnabled ? (
                <AiBillingCheckoutButton
                  label={`${AI_ANALYSIS_PLAN.cta} — $${AI_ANALYSIS_PLAN.priceUsd}/mo`}
                  highlighted
                  className="w-full sm:w-auto"
                />
              ) : (
                <Button disabled className="w-full sm:w-auto" size="lg">
                  Coming soon
                </Button>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Free: 3 OpenAI context analyses per day. Cached posts do not count toward your limit.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          All plans include a 7-day money-back guarantee. Cancel anytime.
        </p>
      </section>

      {/* Comparison table */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          Find the plan that fits you
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/70">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                <th className="px-4 py-4 text-left font-medium text-muted-foreground">Features</th>
                <th className="px-4 py-4 text-center font-semibold">Starter</th>
                <th className="px-4 py-4 text-center font-semibold text-violet-300">Popular</th>
                <th className="px-4 py-4 text-center font-semibold">Pro</th>
              </tr>
              <tr className="border-b border-border/50 bg-muted/10 text-xs text-muted-foreground">
                <th className="px-4 py-2 text-left font-normal" />
                <th className="px-4 py-2 text-center font-normal">$9/mo</th>
                <th className="px-4 py-2 text-center font-normal">$19/mo</th>
                <th className="px-4 py-2 text-center font-normal">$29/mo</th>
              </tr>
            </thead>
            <tbody>
              {BILLING_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    <ComparisonCellIcon value={row.starter} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ComparisonCellIcon value={row.popular} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ComparisonCellIcon value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Frequently asked questions</p>
          <h2 className="text-3xl font-semibold tracking-tight">Everything you need to know</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Clear answers about limits, billing, and what each plan includes for audio-first listening on EchonX.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {BILLING_FAQ.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-border/60">
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer CTA */}
      <section className="grid gap-8 rounded-2xl border border-border/60 bg-card/50 p-6 sm:grid-cols-2 sm:p-8">
        <div>
          <h3 className="text-lg font-semibold">Questions?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re here to help. Visit our{" "}
            <Link href="/faq" className="text-primary underline-offset-2 hover:underline">
              FAQ
            </Link>{" "}
            or contact{" "}
            <a href="/support" className="underline-offset-4 hover:underline">
              support
            </a>
            .
          </p>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:items-end sm:text-right">
          <div>
            <h3 className="text-lg font-semibold">Ready to upgrade your listening?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the plan that fits you and start hearing more of what matters.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 sm:w-auto"
            onClick={() => {
              document.getElementById("plan-cards")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Choose your plan
          </Button>
        </div>
      </section>
    </div>
  );
}
