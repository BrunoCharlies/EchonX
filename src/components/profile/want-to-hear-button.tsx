"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleWantToHear } from "@/server/actions/listen";

type Props = {
  profileId: string | null | undefined;
  initialSubscribed: boolean;
  isAuthenticated: boolean;
  signInCallbackUrl: string | null | undefined;
  labelFollow?: string;
  labelFollowing?: string;
  compact?: boolean;
  className?: string;
};

export function WantToHearButton({
  profileId,
  initialSubscribed,
  isAuthenticated,
  signInCallbackUrl,
  labelFollow = "Follow",
  labelFollowing = "Following",
  compact = false,
  className,
}: Props) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  async function onClick() {
    setError(null);
    const safeProfileId = typeof profileId === "string" && profileId.trim() ? profileId.trim() : null;
    const safeCallbackUrl =
      typeof signInCallbackUrl === "string" && signInCallbackUrl.startsWith("/") ? signInCallbackUrl : "/app";

    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`);
      return;
    }
    if (!safeProfileId) {
      setError("Profile not found.");
      return;
    }
    if (pending) return;

    setPending(true);
    try {
      const result = await toggleWantToHear(safeProfileId);
      if (!result.ok) {
        if (result.code === "PLAN_LIMIT" && !result.subscribed) {
          router.push(result.upgradeUrl ?? "/app/settings/billing?plan=starter&from=follow");
          return;
        }
        setError(result.error ?? "Could not update listening queue.");
        if (typeof result.subscribed === "boolean") setSubscribed(result.subscribed);
        return;
      }
      setSubscribed(result.subscribed);
      router.refresh();
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update listening queue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Button
        size={compact ? "sm" : "lg"}
        className={cn(compact ? "shrink-0" : "sm:min-w-[200px]", subscribed && compact && "border-primary/40")}
        variant={subscribed ? "secondary" : "default"}
        type="button"
        onClick={() => void onClick()}
        disabled={pending || !profileId}
        aria-label={subscribed ? labelFollowing : labelFollow}
      >
        {subscribed ? <UserCheck className="mr-1.5 h-4 w-4" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
        {pending ? "..." : subscribed ? labelFollowing : labelFollow}
      </Button>
      {!compact && error ? <p className="max-w-[240px] text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
