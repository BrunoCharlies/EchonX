import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of service for using EchonX, including acceptable use for audio comments and moderated media.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: May 14, 2026</p>
      <div className="mt-10 max-w-none space-y-4 text-sm text-muted-foreground">
        <p>
          By accessing EchonX you agree to follow our community guidelines, respect intellectual property, and refrain
          from abusive audio comments or disallowed imagery. Automated moderation assists human review but does not
          guarantee safety—report concerns in-product.
        </p>
        <p>
          Paid plans renew according to the billing interval you select inside Stripe&apos;s customer portal. If you
          downgrade, external profile listening limits adjust immediately while native profiles remain unaffected.
        </p>
      </div>
    </div>
  );
}
