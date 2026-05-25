export function formatCheckoutApiError(err: unknown): { error: string; status: number } {
  const message = err instanceof Error ? err.message : "Checkout failed";
  const isLiveTestMismatch = /no such price|similar object exists in test mode|similar object exists in live mode/i.test(
    message,
  );
  const isInvalidUrl = /not a valid url/i.test(message);
  return {
    status: 500,
    error: isLiveTestMismatch
      ? "Stripe plan prices do not match this environment (live vs test). Check STRIPE_PRICE_* on Vercel."
      : isInvalidUrl
        ? "App URL is misconfigured. Set NEXT_PUBLIC_APP_URL=https://echonx.app on Vercel and redeploy."
        : "Could not start checkout. Try again in a moment.",
  };
}
