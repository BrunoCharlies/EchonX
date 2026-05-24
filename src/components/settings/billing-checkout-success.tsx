"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetAudiopostVoiceEngine } from "@/lib/voice/audiopost-voice-session";
import { resetLibraryVoiceEngine } from "@/lib/voice/library-voice-session";

type BillingCheckoutSuccessProps = {
  show: boolean;
};

/** After Stripe redirect, refresh entitlement and reset TTS engine for paid Fish voice. */
export function BillingCheckoutSuccess({ show }: BillingCheckoutSuccessProps) {
  const router = useRouter();

  useEffect(() => {
    if (!show) return;
    resetAudiopostVoiceEngine();
    resetLibraryVoiceEngine();
    router.refresh();
  }, [show, router]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
    >
      Payment received. Your plan is activating—this may take a few seconds. Refresh if limits do not update
      immediately.
    </div>
  );
}
