/** Google Analytics 4 measurement ID (public). */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-L181BDNFNT";

/**
 * GA4 runs when a measurement ID exists and GA is not explicitly disabled.
 * In development, set NEXT_PUBLIC_GA_ENABLED=true to test hits locally.
 */
export function isGa4Enabled(): boolean {
  if (!GA_MEASUREMENT_ID) return false;
  if (process.env.NEXT_PUBLIC_GA_ENABLED === "false") return false;
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_GA_ENABLED !== "true"
  ) {
    return false;
  }
  return true;
}
