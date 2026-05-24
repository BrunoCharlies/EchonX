import type { Metadata } from "next";
import Link from "next/link";
import { getSupportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How EchonX handles data for US-based customers, including X OAuth, Supabase storage, and Stripe billing.",
};

export default function PrivacyPage() {
  const supportEmail = getSupportEmail();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Last updated: May 14, 2026</p>
      <div className="mt-10 space-y-4 text-sm text-muted-foreground">
        <p>
          EchonX processes authentication through X, stores application data in Supabase, and routes billing through Stripe.
          Voice synthesis defaults to on-device playback, which keeps live audio local to your browser whenever possible.
        </p>
        <p>
          Images you upload—including avatars and post attachments—are moderated automatically and stored in secured
          buckets with access policies tied to your account.
        </p>
        <p>
          You may request export or deletion of personal data by emailing{" "}
          <a href={`mailto:${supportEmail}`} className="text-foreground underline-offset-4 hover:underline">
            {supportEmail}
          </a>{" "}
          from your verified session. See also our{" "}
          <Link href="/support" className="text-foreground underline-offset-4 hover:underline">
            Support
          </Link>{" "}
          page. We will respond within the timelines required for United States customers and any applicable state privacy
          laws.
        </p>
      </div>
    </div>
  );
}
