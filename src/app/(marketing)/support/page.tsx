import type { Metadata } from "next";
import Link from "next/link";
import { getSupportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Support",
  description: "Contact EchonX support for billing, privacy, and product help.",
};

export default function SupportPage() {
  const email = getSupportEmail();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Support</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        We respond to account, billing, and privacy requests from verified sessions when possible.
      </p>
      <div className="mt-10 space-y-4 text-sm text-muted-foreground">
        <p>
          Email us at{" "}
          <a href={`mailto:${email}`} className="font-medium text-foreground underline-offset-4 hover:underline">
            {email}
          </a>{" "}
          from the address linked to your EchonX account. Include your public username if the issue is profile-related.
        </p>
        <p>
          For plan limits and Stripe receipts, open{" "}
          <Link href="/app/settings/billing" className="font-medium text-foreground underline-offset-4 hover:underline">
            Billing
          </Link>{" "}
          while signed in. See the <Link href="/faq">FAQ</Link> for listening rules and X profile limits.
        </p>
      </div>
    </div>
  );
}
