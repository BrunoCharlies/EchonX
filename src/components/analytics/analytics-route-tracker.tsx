"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics/gtag";
import { isGa4Enabled } from "@/lib/analytics/ga4-config";

/** Sends GA4 page_path on App Router navigations (SPA). */
export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!isGa4Enabled()) return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    if (lastSent.current === path) return;
    lastSent.current = path;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
