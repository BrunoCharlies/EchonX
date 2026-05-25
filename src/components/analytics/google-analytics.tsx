import Script from "next/script";
import { GA_MEASUREMENT_ID, isGa4Enabled } from "@/lib/analytics/ga4-config";

/**
 * Loads gtag.js once for the whole app (marketing + /app + /admin).
 * Page views on client navigations are sent by AnalyticsRouteTracker.
 */
export function GoogleAnalytics() {
  if (!isGa4Enabled()) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}
