"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Lightweight PWA install affordance. Browsers only fire `beforeinstallprompt` when installability criteria are met.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border/70 bg-background/90 p-4 shadow-xl backdrop-blur">
      <p className="text-sm font-medium">Install EchonX</p>
      <p className="mt-1 text-xs text-muted-foreground">Add the app to your home screen for faster listening.</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" className="gap-2" onClick={() => void install()}>
          <Download className="h-4 w-4" />
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
          Not now
        </Button>
      </div>
    </div>
  );
}
