"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Pencil, Radio, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { QubicChannelState } from "@/lib/curator/qubic-ingest";
import { saveOfficialQubicChannelProfile } from "@/server/actions/official-channel-qubic";

export function QubicChannelAdmin({ initialChannel }: { initialChannel: QubicChannelState }) {
  const [channel, setChannel] = useState(initialChannel);
  const [editing, setEditing] = useState(false);
  const [profilePending, startProfileTransition] = useTransition();
  const [ingestPending, setIngestPending] = useState(false);
  const [backfillPending, setBackfillPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setError(null);
    startProfileTransition(async () => {
      const result = await saveOfficialQubicChannelProfile(formData);
      if (!result.ok) {
        setError(result.error ?? "Unable to save channel.");
        return;
      }
      setMessage(result.message ?? "Channel saved.");
      setChannel((current) => ({
        ...current,
        displayName: String(formData.get("displayName") ?? current.displayName),
        username: String(formData.get("username") ?? current.username)
          .trim()
          .toLowerCase(),
        bio: String(formData.get("bio") ?? ""),
        active: String(formData.get("active")) === "on",
        maxPostsPerRun: Number(formData.get("maxPostsPerRun") ?? current.maxPostsPerRun),
        ingestIntervalMinutes: Number(formData.get("ingestIntervalMinutes") ?? current.ingestIntervalMinutes),
      }));
      setEditing(false);
    });
  }

  async function runBackfill() {
    setBackfillPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/qubic-backfill-images", { method: "POST" });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        updated?: number;
      };
      if (!res.ok || json.ok === false) {
        throw new Error(json.error ?? "Backfill failed.");
      }
      setMessage(json.message ?? "Backfill completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill failed.");
    } finally {
      setBackfillPending(false);
    }
  }

  async function runIngest() {
    setIngestPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/qubic-ingest", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string; created?: number };
      if (!res.ok || json.ok === false) {
        throw new Error(json.error ?? "Ingest failed.");
      }
      setMessage(json.message ?? "Sync completed.");
      if (typeof json.created === "number" && json.created > 0) {
        setChannel((current) => ({ ...current, updatedAt: new Date().toISOString() }));
      }
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed.");
    } finally {
      setIngestPending(false);
    }
  }

  return (
    <Card className="admin-channel-card border-violet-500/30 bg-card/80">
      <CardHeader className="space-y-3 p-4 pb-2 sm:p-5">
        <CardTitle className="flex items-center gap-2 text-base leading-snug">
          <Radio className="h-4 w-4 shrink-0 text-violet-400" />
          Official channel — Qubic
        </CardTitle>
        <CardDescription className="max-w-none text-xs leading-relaxed">
          Slot <span className="font-mono text-[11px]">qubic</span> (@{channel.username}). Mirrors{" "}
          <span className="font-mono text-[11px]">{channel.xHandleDisplay}</span> into the public Explore feed. Free to
          follow; posts enqueue via the same rules as native channels.
        </CardDescription>
        <div className="admin-channel-card__actions">
          <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/u/${channel.username}`} target="_blank" rel="noreferrer">
              View profile
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={backfillPending || ingestPending}
            onClick={() => void runBackfill()}
          >
            <RefreshCw className={backfillPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {backfillPending ? "Importing photos…" : "Backfill X photos"}
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={ingestPending || backfillPending || !channel.active}
            onClick={() => void runIngest()}
          >
            <RefreshCw className={ingestPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {ingestPending ? "Syncing X…" : "Sync from X now"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!editing ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{channel.displayName}</p>
              <p className="text-sm text-muted-foreground">@{channel.username}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                X source: {channel.xHandleDisplay} · every {channel.ingestIntervalMinutes} min · up to{" "}
                {channel.maxPostsPerRun} posts/run · {channel.active ? "active" : "paused"}
              </p>
              {channel.updatedAt ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Last sync: {new Date(channel.updatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
            <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit channel
            </Button>
          </div>
        ) : (
          <form onSubmit={onProfileSubmit} className="space-y-4 rounded-lg border border-border/70 bg-background/50 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qubic-display-name">Display name</Label>
                <Input id="qubic-display-name" name="displayName" defaultValue={channel.displayName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qubic-username">@username</Label>
                <Input id="qubic-username" name="username" defaultValue={channel.username} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qubic-bio">Bio</Label>
              <Textarea id="qubic-bio" name="bio" defaultValue={channel.bio ?? ""} rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="qubic-max-posts">Max posts per sync</Label>
                <Input
                  id="qubic-max-posts"
                  name="maxPostsPerRun"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={channel.maxPostsPerRun}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qubic-interval">Sync interval (minutes)</Label>
                <Input
                  id="qubic-interval"
                  name="ingestIntervalMinutes"
                  type="number"
                  min={15}
                  max={720}
                  defaultValue={channel.ingestIntervalMinutes}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input type="checkbox" id="qubic-active" name="active" defaultChecked={channel.active} />
                <Label htmlFor="qubic-active">Channel active</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qubic-avatar">Avatar</Label>
              <Input id="qubic-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={profilePending}>
                {profilePending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <p className="text-xs text-muted-foreground">
          Cron: <span className="font-mono">POST /api/cron/qubic-x-ingest</span> with{" "}
          <span className="font-mono">Authorization: Bearer CRON_SECRET</span>. Schedule every{" "}
          {channel.ingestIntervalMinutes} minutes in production.
        </p>
      </CardContent>
    </Card>
  );
}
