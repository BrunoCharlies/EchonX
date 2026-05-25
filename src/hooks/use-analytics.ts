"use client";

import { useCallback, useMemo } from "react";
import {
  trackAddProfile,
  trackBeginCheckout,
  trackPurchase,
  trackSignUp,
  trackViewBillingPage,
} from "@/lib/analytics/events";
import { trackGaEvent, trackPageView } from "@/lib/analytics/gtag";
import { isGa4Enabled } from "@/lib/analytics/ga4-config";

export function useAnalytics() {
  const enabled = isGa4Enabled();

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, string | number | boolean | undefined>) => {
      trackGaEvent(eventName, params);
    },
    [],
  );

  const pageView = useCallback((path: string) => {
    trackPageView(path);
  }, []);

  return useMemo(
    () => ({
      enabled,
      trackEvent,
      pageView,
      trackSignUp,
      trackAddProfile,
      trackViewBillingPage,
      trackBeginCheckout,
      trackPurchase,
    }),
    [enabled, trackEvent, pageView],
  );
}
