import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingSignInCta } from "@/components/marketing/pricing-sign-in-cta";

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
          Native EchonX profiles stay unlimited at every tier. You are paying for how many external X profiles you can
          follow with plan-based listening limits.
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

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Taxes may apply. Stripe processes payments securely. You can cancel whenever your listening habits change.
      </p>
    </div>
  );
}
