"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  highlighted?: boolean;
  /** After sign-in, e.g. `/app/settings/billing?library=library-popular#library-premium` */
  signInCallbackUrl?: string;
};

export function PricingSignInCta({ label, highlighted, signInCallbackUrl }: Props) {
  const callback = signInCallbackUrl ?? "/pricing";
  const href = `/login?callbackUrl=${encodeURIComponent(callback)}`;

  return (
    <Button className="w-full" variant={highlighted ? "default" : "outline"} asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
