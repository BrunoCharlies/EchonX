import { GA_MEASUREMENT_ID, isGa4Enabled } from "@/lib/analytics/ga4-config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

type Gtag = (...args: unknown[]) => void;

function gtagSafe(...args: unknown[]) {
  if (!isGa4Enabled() || typeof window === "undefined") return;
  window.gtag?.(...args);
}

/** SPA / App Router: send page_path on every navigation. */
export function trackPageView(path: string) {
  const pagePath = path.startsWith("/") ? path : `/${path}`;
  gtagSafe("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
  });
}

/** GA4 recommended + EchonX custom events. */
export function trackGaEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) cleaned[key] = value;
    }
  }
  gtagSafe("event", eventName, cleaned);
}
