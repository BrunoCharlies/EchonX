import Link from "next/link";
import { PLANS, planPriceLabel } from "@/lib/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Account & billing</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Stripe customer portal integration ships next—this page anchors the UX for US-dollar upgrades and downgrades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active plan</CardTitle>
          <CardDescription>Native profiles stay unlimited at every tier.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Free</p>
            <p className="text-xs text-muted-foreground">{planPriceLabel(PLANS[0])} · 1 external X profile</p>
          </div>
          <Button asChild>
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="border-border/70 bg-card/60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {plan.badge ? <Badge variant="popular">{plan.badge}</Badge> : null}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{planPriceLabel(plan)}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
