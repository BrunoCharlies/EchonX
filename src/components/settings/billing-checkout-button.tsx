"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseCheckoutResponse } from "@/lib/billing/parse-checkout-response";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/lib/plans";

type BillingCheckoutButtonProps = {
  planId: PlanTier;
  label: string;
  disabled?: boolean;
  className?: string;
  highlighted?: boolean;
};

export function BillingCheckoutButton({
  planId,
  label,
  disabled,
  className,
  highlighted,
}: BillingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const parsed = await parseCheckoutResponse(res);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      window.location.href = parsed.url;
    } catch {
      setError("Connection error. Check your network and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 w-full space-y-2">
      <Button
        type="button"
        disabled={disabled || loading}
        onClick={startCheckout}
        className={cn(
          "w-full",
          highlighted
            ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
            : "bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-600/90",
          className,
        )}
        size="lg"
      >
        {loading ? "Redirecting to Stripe…" : label}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
