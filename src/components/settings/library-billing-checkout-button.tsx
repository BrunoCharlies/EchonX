"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LibraryPlanTier } from "@/lib/billing/library-plans";

type LibraryBillingCheckoutButtonProps = {
  planId: LibraryPlanTier;
  label: string;
  disabled?: boolean;
  className?: string;
  highlighted?: boolean;
};

export function LibraryBillingCheckoutButton({
  planId,
  label,
  disabled,
  className,
  highlighted,
}: LibraryBillingCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/billing/library/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Try again.");
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
