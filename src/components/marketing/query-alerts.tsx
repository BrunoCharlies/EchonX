"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

const copy: Record<string, string> = {
  session_secret_missing: "Add SESSION_SECRET to your environment before protecting /app routes.",
  invalid_state: "OAuth state mismatch. Please try signing in again.",
  token_exchange_failed: "X token exchange failed. Verify client credentials and callback URL.",
};

export function QueryAlerts() {
  const params = useSearchParams();
  const [open, setOpen] = useState(true);
  const error = params.get("error");

  useEffect(() => {
    setOpen(true);
  }, [error]);

  if (!error || !open) {
    return null;
  }

  const message = copy[error] ?? "Authentication was interrupted. Please try again.";

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 text-sm text-amber-100 sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">Heads up</p>
          <p className="text-xs text-amber-100/80">{message}</p>
        </div>
        <button type="button" className="text-xs uppercase tracking-wide text-amber-100/80" onClick={() => setOpen(false)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
