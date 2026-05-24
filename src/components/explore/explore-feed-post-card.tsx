"use client";

import Image from "next/image";
import Link from "next/link";
import { PostFeedImage } from "@/components/posts/post-feed-image";
import { PostContextAnalysis } from "@/components/posts/post-context-analysis";
import { parseXImageDimensions } from "@/lib/posts/post-image-display";
import { BadgeCheck, Headphones, MoreHorizontal, Repeat2 } from "lucide-react";
import { AudiopostPlayButton } from "@/components/explore/audiopost-play-button";
import { ExploreWaveform } from "@/components/explore/explore-waveform";
import { exploreCardClass, exploreInsetClass } from "@/components/explore/explore-ui";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { OfficialChannelBadge, isCuratorProfile } from "@/components/profile/official-channel-badge";
import { PostSocialActions } from "@/components/profile/post-social-actions";
import { WantToHearButton } from "@/components/profile/want-to-hear-button";
import type { PostCommentItem } from "@/components/profile/post-comments";
import { cn } from "@/lib/utils";

export type ExploreFeedPost = {
  id: string;
  authorId: string;
  body: string;
  imagePaths: string[];
  likeCount: number;
  externalSource: string | null;
  moderationPayload: Record<string, unknown> | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarPath: string | null;
    kind: string | null;
    ownerXUserId: string;
  };
  liked: boolean;
  isFollowing: boolean;
  isOwnPost: boolean;
  comments: PostCommentItem[];
  listenCount: number;
  canListenAudiopost: boolean;
  listenBlockedMessage?: string;
};

export type ExplorePostLabels = {
  follow: string;
  following: string;
  native: string;
  play: string;
  listenCount: string;
};

type Props = {
  post: ExploreFeedPost;
  locale: string;
  viewerId: string | undefined;
  playingPostId: string | null;
  onPlayingChange: (postId: string | null) => void;
  labels: ExplorePostLabels;
};

function postTitle(body: string) {
  const line = body.trim().split(/\n/)[0] ?? body;
  return line.length <= 120 ? line : `${line.slice(0, 117)}…`;
}

function postExcerpt(body: string) {
  const lines = body.trim().split(/\n/);
  const rest = lines.length > 1 ? lines.slice(1).join(" ") : body;
  const trimmed = rest.trim();
  return trimmed.length <= 200 ? trimmed : `${trimmed.slice(0, 197)}…`;
}

function estimateDurationSec(body: string) {
  const words = body.trim().split(/\s+/).length;
  return Math.max(42, Math.round((words / 140) * 60));
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function categoryLabel(kind: string | null, externalSource: string | null) {
  if (externalSource || kind === "external_x") return "X";
  if (kind === "curator") return "NEWS";
  return "NATIVO";
}

export function ExploreFeedPostCard({ post, locale, viewerId, playingPostId, onPlayingChange, labels }: Props) {
  const isPlaying = playingPostId === post.id;
  const duration = estimateDurationSec(post.body);
  const postUrl = `/u/${post.author.username}/p/${post.id}`;
  const createdAt = new Date(post.createdAt);

  return (
    <article
      className={cn(
        exploreCardClass("overflow-hidden transition-shadow duration-300"),
        isPlaying && "border-primary/40 shadow-[0_0_24px_rgba(0,255,255,0.12)]",
      )}
    >
      <header className="flex items-start gap-3 border-b border-border/50 p-4 dark:border-white/[0.06]">
        <Link href={`/u/${post.author.username}`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-secondary">
          {post.author.avatarPath ? (
            <Image src={post.author.avatarPath} alt="" fill className="object-cover" sizes="44px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <EchonXLogo imageClassName="h-5" />
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/u/${post.author.username}`} className="font-semibold hover:text-primary">
              {post.author.displayName}
            </Link>
            {isCuratorProfile(post.author.kind) ? <BadgeCheck className="h-4 w-4 text-sky-400" /> : null}
            <span className="text-xs text-muted-foreground">@{post.author.username}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {createdAt.toLocaleString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {!post.isOwnPost ? (
            <WantToHearButton
              profileId={post.author.id}
              initialSubscribed={post.isFollowing}
              isAuthenticated={!!viewerId}
              signInCallbackUrl="/app/explore"
              labelFollow={labels.follow}
              labelFollowing={labels.following}
              compact
            />
          ) : null}
          {isCuratorProfile(post.author.kind) ? (
            <OfficialChannelBadge ownerKey={post.author.ownerXUserId} username={post.author.username} />
          ) : (
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
              {categoryLabel(post.author.kind, post.externalSource)}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-3 p-4">
        <h2 className="text-base font-bold leading-snug text-foreground">{postTitle(post.body)}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{postExcerpt(post.body)}</p>

        <PostContextAnalysis
          postId={post.id}
          isAuthenticated={!!viewerId}
          signInCallbackUrl="/app/explore"
        />

        {post.imagePaths.length ? (
          <PostFeedImage
            src={post.imagePaths[0]}
            sizes="640px"
            className="rounded-xl"
            externalSource={post.externalSource}
            authorKind={post.author.kind}
            dimensions={parseXImageDimensions(post.moderationPayload, 0)}
          />
        ) : null}

        <div className={exploreInsetClass("rounded-xl p-3")}>
          <div className="flex items-center gap-3">
            <div
              className="shrink-0"
              onClick={() => onPlayingChange(isPlaying ? null : post.id)}
              onKeyDown={() => undefined}
              role="presentation"
            >
              <AudiopostPlayButton
                postId={post.id}
                text={post.body}
                ariaLabel={labels.play}
                onPlayStart={() => onPlayingChange(post.id)}
                listenAllowed={post.canListenAudiopost}
                listenBlockedMessage={post.listenBlockedMessage}
              />
            </div>
            <ExploreWaveform active={isPlaying} />
            <div className="shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
              <p>{isPlaying ? formatDuration(Math.floor(duration * 0.15)) : "00:00"}</p>
              <p>/ {formatDuration(duration)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3 text-muted-foreground dark:border-white/[0.06]">
          <PostSocialActions
            postId={post.id}
            postUrl={postUrl}
            post={{
              authorName: post.author.displayName,
              username: post.author.username,
              avatarPath: post.author.avatarPath,
              body: post.body,
              createdAt: post.createdAt,
              imagePaths: post.imagePaths,
              likeCount: post.likeCount,
              liked: post.liked,
              externalSource: post.externalSource,
              authorKind: post.author.kind,
              moderationPayload: post.moderationPayload,
            }}
            comments={post.comments}
            likeCount={post.likeCount}
            liked={post.liked}
            isAuthenticated={!!viewerId}
            signInCallbackUrl="/app/explore"
          />
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              0
            </span>
            <span className="inline-flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5" />
              {post.listenCount} {labels.listenCount}
            </span>
            <button type="button" className="rounded-full p-1 hover:bg-white/5" aria-label="More">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
