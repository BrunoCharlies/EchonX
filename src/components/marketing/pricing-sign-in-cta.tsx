"use client";

import { SignInWithTwitterButton } from "@/components/auth/sign-in-with-twitter-button";

type Props = {
  label: string;
  highlighted?: boolean;
};

/** Pricing cards stay server-rendered; this small client island triggers OAuth correctly. */
export function PricingSignInCta({ label, highlighted }: Props) {
  return (
    <SignInWithTwitterButton className="w-full" variant={highlighted ? "default" : "outline"} callbackUrl="/pricing">
      {label}
    </SignInWithTwitterButton>
  );
}
