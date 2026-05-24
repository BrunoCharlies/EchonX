"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  highlighted?: boolean;
};

export function PricingSignInCta({ label, highlighted }: Props) {
  return (
    <Button className="w-full" variant={highlighted ? "default" : "outline"} asChild>
      <Link href="/login?callbackUrl=%2Fpricing">{label}</Link>
    </Button>
  );
}
