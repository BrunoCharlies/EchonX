"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, X } from "lucide-react";
import { addXProfileToListening } from "@/server/actions/x-listening";
import { getFollowedProfiles, unfollowProfile, type FollowedProfile } from "@/server/actions/listen";
import { EMPTY_AUDIOPOST_QUEUE_EVENT } from "@/lib/audiopost/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { audiopostCardClass, audiopostCardPadding, audiopostSectionLabelClass } from "@/components/app/audiopost-premium";
import { cn } from "@/lib/utils";

function formatSynced(since: string | null) {
  if (!since) return "Synced recently";
  const ms = Date.now() - Date.parse(since);
  if (Number.isNaN(ms)) return "Synced recently";
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins < 60) return `Synced ${mins}m ago`;
  const hours = Math.round(mins / 60);
  return `Synced ${hours}h ago`;
}

export function AudiopostXProfilesPanel() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<FollowedProfile[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    void getFollowedProfiles().then(setProfiles);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const handler = () => {
      setHighlighted(true);
      setShowAdd(true);
      timeoutId = setTimeout(() => setHighlighted(false), 4500);
    };
    window.addEventListener(EMPTY_AUDIOPOST_QUEUE_EVENT, handler);
    return () => {
      window.removeEventListener(EMPTY_AUDIOPOST_QUEUE_EVENT, handler);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
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
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
      form.reset();
      setProfiles(await getFollowedProfiles());
      setShowAdd(false);
      setHighlighted(false);
    });
  }

  function onRemove(profile: FollowedProfile) {
    setError(null);
    setRemovingId(profile.id);
    startTransition(async () => {
      const result = await unfollowProfile(profile.id);
      setRemovingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.dispatchEvent(new Event("echonx:listening-queue-refresh"));
      setProfiles(await getFollowedProfiles());
    });
  }

  const empty = profiles.length === 0;

  return (
    <div
      id="x-profiles"
      className={cn(
        audiopostCardClass(),
        audiopostCardPadding,
        "flex h-full min-h-0 flex-col overflow-hidden scroll-mt-4 transition-[box-shadow,ring-color]",
        highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-transparent shadow-[0_0_28px_rgba(0,255,255,0.35)]",
      )}
    >
      <p className={cn(audiopostSectionLabelClass, "shrink-0 text-muted-foreground")}>X profiles</p>

      {empty && !showAdd ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-muted-foreground opacity-65">
            No profiles yet. Add one below.
          </p>
          <Button
            type="button"
            className="mt-4 h-11 w-full max-w-[200px] rounded-xl border border-dashed border-primary/40 bg-primary/5 text-xs font-medium"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add X profile
          </Button>
        </div>
      ) : (
        <>
          {profiles.length > 0 ? (
            <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
              {profiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    {(profile.displayName ?? profile.username).slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{profile.displayName ?? profile.username}</p>
                    <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <div className="hidden text-right sm:block">
                      <p className="flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Synced
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatSynced(profile.listeningSince)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                      disabled={pending || removingId === profile.id}
                      aria-label={`Remove @${profile.username} from listening`}
                      title="Remove profile"
                      onClick={() => onRemove(profile)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {showAdd || empty ? (
            <form onSubmit={onSubmit} className={cn("shrink-0 space-y-2", profiles.length > 0 && "mt-3 border-t border-white/[0.06] pt-3")}>
              <Input
                name="handle"
                placeholder="@elonmusk"
                autoComplete="off"
                required
                className="h-10 rounded-xl placeholder:text-muted-foreground/40"
              />
              {error ? <p className="text-xs text-destructive">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending} className="h-10 flex-1 rounded-xl">
                  {pending ? "Adding…" : "Add profile"}
                </Button>
                {profiles.length > 0 ? (
                  <Button type="button" variant="ghost" size="sm" className="h-10 rounded-xl" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
              <p className="text-[10px] text-muted-foreground opacity-70">
                Example handle only — use any public @username. Paid plans:{" "}
                <Link href="/app/settings/billing?plan=starter&from=x_profile" className="text-primary underline">
                  upgrade
                </Link>
              </p>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="mt-3 h-11 w-full shrink-0 gap-2 rounded-xl border-dashed border-primary/40"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="h-4 w-4" />
              Add X profile
            </Button>
          )}
        </>
      )}
    </div>
  );
}
