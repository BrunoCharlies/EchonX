"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AnalyticsRouteTracker } from "@/components/analytics/analytics-route-tracker";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ListenQueueProvider } from "@/components/listen/listen-queue-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

/** Skip queue/realtime on marketing + auth — faster login and public pages. */
function needsListenQueue(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/") || pathname === "/profile" || pathname.startsWith("/profile/");
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const withQueue = needsListenQueue(pathname);

  return (
    <TooltipProvider delayDuration={200}>
      <Suspense fallback={null}>
        <AnalyticsRouteTracker />
      </Suspense>
      {withQueue ? <ListenQueueProvider>{children}</ListenQueueProvider> : children}
      <InstallPrompt />
    </TooltipProvider>
  );
}
