"use client";

import Link from "next/link";
import { useAudiopostLibrary } from "@/contexts/audiopost-library-context";
import { formatLibraryQuotaShort } from "@/lib/billing/library-quota-policy";
import { getLibraryPlanById } from "@/lib/billing/library-plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LibraryQuotaStrip({ className }: { className?: string }) {
  const { libraryVoiceStatus } = useAudiopostLibrary();
  const status = libraryVoiceStatus;
  if (!status) return null;

  if (status.fishActive && status.periodByteQuota > 0) {
    const remaining = status.bytesRemaining ?? 0;
    const used = Math.max(0, status.periodByteQuota - remaining);
    const pct = Math.min(100, Math.round((used / status.periodByteQuota) * 100));

    return (
      <div className={cn("flex min-w-0 flex-col gap-1", className)}>
        <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <span>
            Fish · {formatLibraryQuotaShort(remaining)} remaining
            {status.plan ? ` (${getLibraryPlanById(status.plan).name})` : ""}
          </span>
          <span>{pct}% used</span>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 90 ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (status.exhaustedAction?.kind === "upgrade" && status.upgradeUrl) {
    const target = getLibraryPlanById(status.exhaustedAction.targetPlan);
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5",
          className,
        )}
      >
        <p className="text-[10px] leading-snug text-amber-100/90">
          Premium voice used up. Upgrade for more Fish narration this month.
        </p>
        <Button asChild size="sm" variant="secondary" className="h-7 shrink-0 text-[10px]">
          <Link href={status.upgradeUrl}>Upgrade to {target.name}</Link>
        </Button>
      </div>
    );
  }

  if (status.exhaustedAction?.kind === "wait_renewal") {
    const end = status.currentPeriodEnd
      ? new Date(status.currentPeriodEnd).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : null;
    return (
      <p
        className={cn(
          "text-[10px] leading-snug text-muted-foreground",
          className,
        )}
      >
        {end
          ? `Library Pro allowance renews ${end}. Listening continues with browser voice.`
          : "Allowance renews on your next billing date. Browser voice is unlimited."}
      </p>
    );
  }

  if (!status.plan) {
    return (
      <p className={cn("text-[10px] text-muted-foreground", className)}>
        Browser voice · unlimited.{" "}
        <Link href="/app/settings/billing#library-premium" className="text-primary hover:underline">
          Library Premium
        </Link>{" "}
        unlocks Fish S2 Pro.
      </p>
    );
  }

  return null;
}
