"use client";

import { SessionProvider } from "next-auth/react";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ListenQueueProvider } from "@/components/listen/listen-queue-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ListenQueueProvider>{children}</ListenQueueProvider>
      <InstallPrompt />
    </SessionProvider>
  );
}
