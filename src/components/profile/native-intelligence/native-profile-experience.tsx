import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Brain,
  Headphones,
  Radio,
  Sparkles,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewPostPanel } from "@/components/profile/new-post-panel";
import { PostsLive } from "@/components/profile/posts-live";
import { WantToHearButton } from "@/components/profile/want-to-hear-button";
import { NativeTransmissionCard } from "@/components/profile/native-intelligence/native-transmission-card";
import type { PostCommentItem } from "@/components/profile/post-comments";
import type { PublicProfileRow } from "@/lib/profiles/load-public-profile";
import type { NativeProfileIntelligence } from "@/lib/profiles/load-native-profile-intelligence";
import { cn } from "@/lib/utils";

type Props = {
  profile: PublicProfileRow;
  posts: Awaited<ReturnType<typeof import("@/lib/profiles/load-public-profile").loadPublicPostsByAuthorId>>;
  comments: PostCommentItem[];
  liked: Set<string>;
  intelligence: NativeProfileIntelligence;
  subscribed: boolean;
  listeningSince: Date | null;
  canListenAudiopost: boolean;
  listenBlockedMessage?: string;
  viewerId?: string;
  isOwnProfile: boolean;
  callbackUrl: string;
  profileName: string;
  postCount: number;
  coverPath: string | null;
  t: { explore: { follow: string; following: string } };
};

function GlassMetric({
  icon: Icon,
  label,
  value,
  suffix,
  accent = "cyan",
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  suffix?: string;
  accent?: "cyan" | "violet";
}) {
  return (
    <div
      className={cn(
        "echonx-glass-metric group relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5",
        accent === "cyan"
          ? "border-cyan-500/20 bg-cyan-500/[0.04] hover:border-cyan-400/40 hover:shadow-[0_0_28px_-8px_hsl(188_94%_43%/0.5)]"
          : "border-violet-500/20 bg-violet-500/[0.04] hover:border-violet-400/40 hover:shadow-[0_0_28px_-8px_hsl(262_83%_58%/0.45)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon
          className={cn("h-4 w-4", accent === "cyan" ? "text-cyan-400/80" : "text-violet-400/80")}
          aria-hidden
        />
        <div className="flex h-6 items-end gap-px opacity-50" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={cn("w-0.5 rounded-full animate-explore-wave", accent === "cyan" ? "bg-cyan-400" : "bg-violet-400")}
              style={{ height: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
        {suffix ? <span className="ml-1 text-sm font-normal text-zinc-500">{suffix}</span> : null}
      </p>
    </div>
  );
}

function ReputationBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-medium text-zinc-300">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="echonx-rep-bar h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function NativeProfileExperience({
  profile,
  posts,
  comments,
  liked,
  intelligence,
  subscribed,
  listeningSince,
  canListenAudiopost,
  listenBlockedMessage,
  viewerId,
  isOwnProfile,
  callbackUrl,
  profileName,
  postCount,
  coverPath,
  t,
}: Props) {
  const { metrics, reputation } = intelligence;
  const signalLabel = String(intelligence.signalLevel).padStart(2, "0");
  const maxTimeline = Math.max(...intelligence.timelineMonths.map((m) => m.hours), 1);
  const yearGrowth = intelligence.timelineMonths.reduce((s, m) => s + m.hours, 0);

  return (
    <div className="echonx-native-profile min-h-dvh bg-[#030304] text-zinc-100">
      <PostsLive authorProfileId={profile.id} />

      {/* Hero */}
      <section className="relative border-b border-white/[0.06]">
        <div className="relative h-44 sm:h-56 lg:h-64">
          {coverPath ? (
            <Image src={coverPath} alt="" fill className="object-cover opacity-70" sizes="100vw" unoptimized />
          ) : (
            <div className="np-hero-fallback absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(188_94%_43%/0.25),transparent_50%),radial-gradient(ellipse_at_80%_60%,hsl(262_83%_58%/0.2),transparent_45%),linear-gradient(180deg,#0a0b10,#030304)]" />
          )}
          <div className="np-hero-overlay absolute inset-0 bg-gradient-to-t from-[#030304] via-[#030304]/60 to-transparent" />
          <div className="np-hero-glow absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,hsl(188_94%_43%/0.12),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
                <div className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-cyan-400/50 via-violet-500/30 to-cyan-500/20 blur-md echonx-avatar-pulse" />
                <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] border-2 border-cyan-400/30 bg-zinc-900 shadow-[0_0_40px_-8px_hsl(188_94%_43%/0.6)]">
                  {profile.avatar_path ? (
                    <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="144px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">No photo</div>
                  )}
                </div>
              </div>
              <div className="space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{profileName}</h1>
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                    <Zap className="h-3 w-3" aria-hidden />
                  </span>
                </div>
                <p className="text-sm text-zinc-500">@{profile.username}</p>
                <p className="text-sm text-zinc-400">{intelligence.memberSubtitle}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/15">
                    Native EchonX
                  </Badge>
                  <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-200">
                    AI Context
                  </Badge>
                  {intelligence.listeningNow ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Listening now
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex w-full min-w-0 items-stretch gap-2 sm:w-auto sm:gap-3">
              <div className="echonx-signal-badge flex min-h-[108px] min-w-0 flex-1 flex-col justify-between rounded-2xl border border-cyan-500/25 bg-black/50 px-3 py-3 backdrop-blur-xl sm:min-w-[120px] sm:flex-none sm:px-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">Signal level</p>
                <p className="mt-0.5 font-mono text-2xl font-bold text-cyan-300">{signalLabel}</p>
                <div className="mt-2 flex h-4 items-end gap-px">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-sm bg-cyan-400/60 animate-explore-wave"
                      style={{ height: `${6 + (i % 4) * 3}px`, animationDelay: `${i * 0.05}s` }}
                    />
                  ))}
                </div>
              </div>
              <div className="echonx-context-ring flex min-h-[108px] w-[108px] shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-black/50 p-2 backdrop-blur-xl">
                <div className="relative aspect-square size-[80px]">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(63 63 70 / 0.5)" strokeWidth="2" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="url(#ctxGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${intelligence.contextScore} 100`}
                    />
                    <defs>
                      <linearGradient id="ctxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(262 83% 58%)" />
                        <stop offset="100%" stopColor="hsl(188 94% 43%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[8px] uppercase tracking-wider text-violet-300/70">Context</p>
                    <p className="text-xl font-bold text-violet-100">{intelligence.contextScore}</p>
                  </div>
                </div>
              </div>
              <div className="flex min-h-[108px] shrink-0 items-center">
                {!isOwnProfile ? (
                  <WantToHearButton
                    profileId={profile.id}
                    initialSubscribed={subscribed}
                    isAuthenticated={!!viewerId}
                    signInCallbackUrl={callbackUrl}
                    labelFollow={t.explore.follow}
                    labelFollowing={t.explore.following}
                    className="min-w-[120px] sm:min-w-[140px]"
                  />
                ) : (
                  <Button
                    asChild
                    className="h-full min-h-[44px] border-cyan-500/40 bg-cyan-500/15 px-4 text-cyan-100 hover:bg-cyan-500/25"
                    variant="outline"
                  >
                    <Link href="/profile">Edit identity</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live metrics */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <GlassMetric icon={Headphones} label="Total listening time" value={metrics.totalListeningHours} suffix="hrs" />
          <GlassMetric icon={Radio} label="Posts heard this week" value={metrics.postsHeardThisWeek} accent="violet" />
          <GlassMetric icon={Waves} label="Audio interactions" value={metrics.totalAudioInteractions} />
          <GlassMetric icon={Sparkles} label="AI context runs" value={metrics.aiVerificationsTriggered} accent="violet" />
          <GlassMetric icon={Activity} label="Deep listen rate" value={metrics.deepListenRatePercent} suffix="%" />
          <GlassMetric
            icon={Users}
            label="Followers listening"
            value={metrics.followersListeningNow}
            suffix="live"
            accent="violet"
          />
        </div>
      </section>

      {/* Main grid */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_320px] lg:px-8">
        {/* Left column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" aria-hidden />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">AI Context Summary</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-400">{intelligence.aiSummary}</p>
            <p className="np-cognitive-tags-label mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Cognitive tags
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {intelligence.cognitiveTags.map((tag) => (
                <span
                  key={tag}
                  className="np-cognitive-tag rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1 text-xs text-cyan-100/90 shadow-[0_0_16px_-6px_hsl(188_94%_43%/0.4)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Signal Reputation</h2>
            <div className="mt-5 space-y-4">
              <ReputationBar label="Context consistency" value={reputation.contextConsistency} />
              <ReputationBar label="Verification accuracy" value={reputation.verificationAccuracy} />
              <ReputationBar label="Listening engagement" value={reputation.listeningEngagement} />
              <ReputationBar label="Audience retention" value={reputation.audienceRetention} />
              <ReputationBar label="Audio completion rate" value={reputation.audioCompletionRate} />
            </div>
            <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-violet-300/70">Overall reputation</p>
              <p className="mt-1 text-3xl font-bold text-violet-100">{reputation.grade}</p>
              <p className="mt-1 text-xs text-zinc-500">High integrity · Deep insights · Trusted signal</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Listening activity</h2>
            <p className="text-[11px] text-zinc-600">Last 30 days</p>
            <div className="mt-4 flex h-24 items-end gap-1">
              {intelligence.listeningActivityBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-cyan-600/40 to-cyan-400/80 transition-all hover:from-cyan-500/60 hover:to-cyan-300"
                  style={{ height: `${Math.max(8, h)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center — transmissions */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Intelligence transmissions</h2>
              <p className="text-xs text-zinc-600">{postCount} signals · audio-native · context-aware</p>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-300/80">
              {postCount} total
            </Badge>
          </div>

          {isOwnProfile ? (
            <div className="rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-500/[0.03] p-1">
              <NewPostPanel />
            </div>
          ) : null}

          {(posts ?? []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
              No transmissions yet. When this identity publishes, signals appear here.
            </div>
          ) : null}

          {(posts ?? []).map((post) => {
            const createdAt = new Date(post.created_at);
            const autoQueued = subscribed && listeningSince ? createdAt >= listeningSince : false;
            const postComments = comments.filter((c) => c.post_id === post.id);
            const stats = intelligence.postStats[post.id] ?? {
              listenMinutes: 1,
              completionPercent: 75,
              interactions: 0,
              contextScore: 84,
              aiVerified: false,
            };
            return (
              <NativeTransmissionCard
                key={post.id}
                post={post as Parameters<typeof NativeTransmissionCard>[0]["post"]}
                profile={{
                  id: profile.id,
                  username: profile.username,
                  display_name: profile.display_name,
                  avatar_path: profile.avatar_path,
                  kind: profile.kind,
                }}
                profileName={profileName}
                postUrl={`/u/${profile.username}/p/${post.id}`}
                stats={stats}
                autoQueued={autoQueued}
                comments={postComments}
                liked={liked.has(post.id)}
                viewerId={viewerId}
                callbackUrl={callbackUrl}
                canListenAudiopost={canListenAudiopost}
                listenBlockedMessage={listenBlockedMessage}
              />
            );
          })}
        </div>

        {/* Right — network */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Network signals</h2>
            <div className="relative mx-auto mt-6 flex h-40 w-40 items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-500/10 echonx-neural-scan" />
              <div className="absolute inset-4 rounded-full border border-violet-500/15" />
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-[10px] font-medium text-cyan-200">
                Signal
              </div>
              {[0, 1, 2, 3, 4].map((i) => {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const x = 50 + Math.cos(angle) * 38;
                const y = 50 + Math.sin(angle) * 38;
                return (
                  <span
                    key={i}
                    className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400/70 shadow-[0_0_12px_hsl(188_94%_43%/0.8)]"
                    style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                  />
                );
              })}
            </div>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Top connections</p>
            <ul className="mt-3 space-y-3">
              {intelligence.networkConnections.length ? (
                intelligence.networkConnections.map((conn) => (
                  <li key={conn.id}>
                    <Link
                      href={`/u/${conn.username}`}
                      className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]"
                    >
                      <div className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/10">
                        {conn.avatarPath ? (
                          <Image src={conn.avatarPath} alt="" fill className="object-cover" sizes="36px" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-500">
                            {conn.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">{conn.displayName}</p>
                        <p className="text-[11px] text-zinc-600">@{conn.username}</p>
                      </div>
                      <span className="text-xs text-cyan-400/80">{conn.listeningHours}h</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-zinc-600">Follow profiles to map your listening network.</li>
              )}
            </ul>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Context overlap</p>
            <div className="mt-3 space-y-3">
              {intelligence.contextOverlaps.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">{row.label}</span>
                    <span className="text-zinc-400">{row.percent}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">Top listening categories</h2>
            <div className="mt-4 space-y-2">
              {intelligence.topCategories.map((cat, i) => (
                <div key={cat.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      i === 0 ? "bg-cyan-400" : i === 1 ? "bg-violet-400" : i === 2 ? "bg-blue-400" : "bg-amber-400/80",
                    )}
                  />
                  <span className="flex-1 text-zinc-500">{cat.label}</span>
                  <span className="text-zinc-400">{cat.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {!isOwnProfile ? (
            <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
              <p className="text-xs text-zinc-500">Follow this identity to receive future transmissions in Audiopost.</p>
              <WantToHearButton
                profileId={profile.id}
                initialSubscribed={subscribed}
                isAuthenticated={!!viewerId}
                signInCallbackUrl={callbackUrl}
                labelFollow={t.explore.follow}
                labelFollowing={t.explore.following}
                className="mt-3 w-full"
              />
            </div>
          ) : null}
        </aside>
      </section>

      {/* Audio journey timeline */}
      <section className="np-timeline-section border-t border-white/[0.06] bg-black/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Audio journey timeline</h2>
              <p className="mt-1 text-xs text-zinc-600">Signal accumulation over recent cycles</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Total growth</p>
              <p className="text-2xl font-semibold text-cyan-300">+{yearGrowth.toLocaleString("en-US")}h</p>
              <p className="text-xs text-zinc-600">This year</p>
            </div>
          </div>
          <div className="mt-8 flex h-32 items-end justify-between gap-2 sm:gap-4">
            {intelligence.timelineMonths.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full max-w-[4rem] rounded-t-lg bg-gradient-to-t from-cyan-600/30 via-cyan-400/70 to-violet-400/50 transition-all hover:brightness-125"
                  style={{ height: `${Math.max(12, (m.hours / maxTimeline) * 100)}%` }}
                />
                <span className="text-[10px] text-zinc-600">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
