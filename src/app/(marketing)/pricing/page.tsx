import type { Metadata } from "next";
import { Check, ShieldCheck } from "lucide-react";
import { AI_ANALYSIS_PLAN } from "@/lib/billing/ai-plans";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingSignInCta } from "@/components/marketing/pricing-sign-in-cta";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose Free, Starter, Popular, or Pro. EchonX keeps native profiles unlimited while external X listening scales with your plan.",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Simple US dollar pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Native EchonX profiles stay unlimited at every tier. Free includes official @qubic on X; paid plans add custom
          external X profiles with plan-based listening limits.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.highlighted
                ? "border-primary/60 bg-gradient-to-b from-primary/10 via-card to-card shadow-lg shadow-primary/15"
                : "border-border/80 bg-card/60"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.badge ? (
                  <Badge variant="popular" className="text-[10px] uppercase tracking-wide">
                    {plan.badge}
                  </Badge>
                ) : null}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-4 text-3xl font-semibold tracking-tight">{planPriceLabel(plan)}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <PricingSignInCta label={plan.cta} highlighted={plan.highlighted} />
            </CardFooter>
          </Card>
        ))}
      </div>

      <section id="ai-plan" className="mt-16 scroll-mt-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/8 via-card/60 to-cyan-500/8 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
            </div>
            <div className="min-w-0 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{AI_ANALYSIS_PLAN.name}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{AI_ANALYSIS_PLAN.description}</p>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {AI_ANALYSIS_PLAN.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Free: 3 context analyses per day. Premium: {AI_ANALYSIS_PLAN.dailyAnalyses} per day.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <div>
              <p className="text-3xl font-semibold tracking-tight">${AI_ANALYSIS_PLAN.priceUsd}</p>
              <p className="text-sm text-muted-foreground">/ month · recurring</p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login?callbackUrl=%2Fapp%2Fsettings%2Fbilling%23ai-plan">
                {AI_ANALYSIS_PLAN.cta}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Taxes may apply. Stripe processes payments securely. You can cancel whenever your listening habits change.
      </p>
    </div>
  );
}
