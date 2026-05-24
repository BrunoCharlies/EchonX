"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Pencil, Radio, RefreshCw, Rss } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OfficialChannelState } from "@/lib/curator/ingest";
import {
  saveOfficialNewsChannelProfile,
  saveOfficialNewsFeedSources,
} from "@/server/actions/official-channel";

type FeedRow = { label: string; feedUrl: string; active: boolean };

function defaultFeeds(channel: OfficialChannelState): FeedRow[] {
  if (channel.sources.length) {
    return channel.sources.map((s) => ({ label: s.label, feedUrl: s.feedUrl, active: s.active }));
  }
  return [{ label: "Headlines", feedUrl: "", active: true }];
}

export function OfficialChannelAdmin({ initialChannel }: { initialChannel: OfficialChannelState }) {
  const [channel, setChannel] = useState(initialChannel);
  const [editing, setEditing] = useState(false);
  const [profilePending, startProfileTransition] = useTransition();
  const [sourcesPending, startSourcesTransition] = useTransition();
  const [ingestPending, setIngestPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<FeedRow[]>(() => defaultFeeds(initialChannel));

  function onProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setError(null);
    startProfileTransition(async () => {
      const result = await saveOfficialNewsChannelProfile(formData);
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

  function onSourcesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    feeds.forEach((row) => {
      formData.append("sourceLabel", row.label);
      formData.append("sourceUrl", row.feedUrl);
      formData.append("sourceActive", String(row.active));
    });
    setMessage(null);
    setError(null);
    startSourcesTransition(async () => {
      const result = await saveOfficialNewsFeedSources(formData);
      if (!result.ok) {
        setError(result.error ?? "Unable to save feeds.");
        return;
      }
      setMessage(result.message ?? "Feeds saved.");
      setChannel((current) => ({
        ...current,
        sources: feeds.map((row, index) => ({
          id: current.sources[index]?.id ?? `saved-${index}`,
          label: row.label,
          feedUrl: row.feedUrl,
          active: row.active,
          lastFetchedAt: current.sources[index]?.lastFetchedAt ?? null,
        })),
      }));
    });
  }

  async function runIngest() {
    setIngestPending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/curator-ingest", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; message?: string; error?: string; created?: number };
      if (!res.ok || json.ok === false) {
        throw new Error(json.error ?? "Ingest failed.");
      }
      setMessage(json.message ?? "Ingest completed.");
      if (typeof json.created === "number" && json.created > 0) {
        setChannel((current) => ({
          ...current,
          sources: current.sources.map((s) => ({ ...s, lastFetchedAt: new Date().toISOString() })),
        }));
      }
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingest failed.");
    } finally {
      setIngestPending(false);
    }
  }

  return (
    <Card className="admin-channel-card border-primary/30 bg-card/80">
      <CardHeader className="space-y-3 p-4 pb-2 sm:p-5">
        <CardTitle className="flex items-center gap-2 text-base leading-snug">
          <Radio className="h-4 w-4 shrink-0 text-primary" />
          Official channel — News
        </CardTitle>
        <CardDescription className="max-w-none text-xs leading-relaxed">
          Slot <span className="font-mono text-[11px]">news</span> (@news). Curated RSS headlines publish as native feed posts
          on{" "}
          <Link href={`/u/${channel.username}`} className="text-primary hover:underline">
            @{channel.username}
          </Link>
          . Platform updates will use a separate <span className="font-mono text-[11px]">echonx</span> channel later. Headlines
          get a generated preview card (no Supabase storage). Optional RSS photo hotlink when the feed provides one. Links in
          post; audio skips URLs (max 220 chars). Queue: new posts after follow only.
        </CardDescription>
        <div className="admin-channel-card__actions">
          <Button type="button" variant="outline" size="sm" className="gap-2" disabled={ingestPending} onClick={() => void runIngest()}>
            <RefreshCw className={ingestPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {ingestPending ? "Publishing..." : "Publish now"}
          </Button>
          {!editing ? (
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
        {!editing ? (
          <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-background/60 p-4 sm:flex-row">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
              {channel.avatarPath ? (
                <img src={channel.avatarPath} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No avatar</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium text-primary">Active News channel</p>
              <h3 className="text-xl font-semibold">{channel.displayName}</h3>
              <p className="text-sm text-muted-foreground">@{channel.username}</p>
              {channel.bio ? <p className="mt-2 text-sm text-muted-foreground">{channel.bio}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Status: {channel.active ? "Publishing enabled" : "Paused"} · up to {channel.maxPostsPerRun} posts per run ·{" "}
                {channel.sources.filter((s) => s.active).length} active RSS source
                {channel.sources.filter((s) => s.active).length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="official-display-name">Display name</Label>
                <Input id="official-display-name" name="displayName" defaultValue={channel.displayName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="official-username">@username</Label>
                <Input id="official-username" name="username" defaultValue={channel.username} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="official-bio">Bio</Label>
              <Textarea id="official-bio" name="bio" defaultValue={channel.bio ?? ""} rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="official-max-posts">Max posts per run</Label>
                <Input
                  id="official-max-posts"
                  name="maxPostsPerRun"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={channel.maxPostsPerRun}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="official-interval">Ingest interval (minutes)</Label>
                <Input
                  id="official-interval"
                  name="ingestIntervalMinutes"
                  type="number"
                  min={30}
                  max={720}
                  defaultValue={channel.ingestIntervalMinutes}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input type="checkbox" id="official-active" name="active" defaultChecked={channel.active} />
                <Label htmlFor="official-active">Channel active</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="official-avatar">Avatar</Label>
              <Input id="official-avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={profilePending}>
                {profilePending ? "Saving..." : "Save channel"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <form className="space-y-4 rounded-xl border border-border/70 bg-background/40 p-4" onSubmit={onSourcesSubmit}>
          <div className="flex items-center gap-2">
            <Rss className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">RSS sources (terms-compliant feeds only)</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Use official RSS URLs from publishers that allow aggregation. Each item becomes one post with a source link.
          </p>
          <div className="space-y-3">
            {feeds.map((row, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-border/60 p-3 md:grid-cols-[1fr,2fr,auto]">
                <Input
                  placeholder="Label"
                  value={row.label}
                  onChange={(e) =>
                    setFeeds((rows) => rows.map((r, i) => (i === index ? { ...r, label: e.target.value } : r)))
                  }
                />
                <Input
                  placeholder="https://example.com/rss.xml"
                  value={row.feedUrl}
                  onChange={(e) =>
                    setFeeds((rows) => rows.map((r, i) => (i === index ? { ...r, feedUrl: e.target.value } : r)))
                  }
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) =>
                      setFeeds((rows) => rows.map((r, i) => (i === index ? { ...r, active: e.target.checked } : r)))
                    }
                  />
                  Active
                </label>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeeds((rows) => [...rows, { label: "", feedUrl: "", active: true }])}
            >
              Add source
            </Button>
            <Button type="submit" size="sm" disabled={sourcesPending}>
              {sourcesPending ? "Saving feeds..." : "Save RSS sources"}
            </Button>
          </div>
        </form>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
