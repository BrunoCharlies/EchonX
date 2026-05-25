"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { trackAddProfile } from "@/lib/analytics/events";
import { addXProfileToListening, syncMyXListeningQueue } from "@/server/actions/x-listening";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function XProfileListeningForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profilePath, setProfilePath] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function notifyQueue() {
    window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setProfilePath(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addXProfileToListening(formData);
      if (!result.ok) {
        if (result.code === "PLAN_LIMIT") {
          router.push(result.upgradeUrl ?? "/app/settings/billing?plan=starter&from=x_profile");
          return;
        }
        setError(result.error);
        return;
      }
      trackAddProfile("listening_form");
      setMessage(result.message);
      setProfilePath(result.profilePath);
      notifyQueue();
    });
  }

  function onSyncNow() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await syncMyXListeningQueue();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      notifyQueue();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="x-handle">X profile to hear</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="x-handle" name="handle" placeholder="@elonmusk" autoComplete="off" required />
            <Button type="submit" disabled={pending} className="sm:min-w-[150px]">
              <Radio className="mr-2 h-4 w-4" />
              {pending ? "Adding..." : "Add profile"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Paid plans add X @handles here. X posts sync globally every ~30 min while you are online (heartbeat). On Free,
          use <strong>@_Qubic_</strong> or native EchonX profiles — adding another @ opens{" "}
          <Link href="/app/settings/billing?plan=starter&from=x_profile" className="underline">
            Plans & billing
          </Link>
          .
        </p>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onSyncNow} disabled={pending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync now
        </Button>
        {profilePath ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={profilePath}>Open imported profile</Link>
          </Button>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
