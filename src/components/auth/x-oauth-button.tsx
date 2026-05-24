"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  callbackUrl: string;
  label?: string;
};

export function XOAuthButton({ callbackUrl, label = "Continue with X" }: Props) {
  const { dictionary: t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const safeCallback = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/app";

  function signInWithX() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "x" as "twitter",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeCallback)}`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full gap-2" disabled={pending} onClick={signInWithX}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
          X
        </span>
        {pending ? t.auth.redirecting : label === "Continue with X" ? t.auth.continueWithX : label}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
