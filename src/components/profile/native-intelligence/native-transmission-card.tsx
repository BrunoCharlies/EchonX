"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { ListenButton } from "@/components/app/listen-button";
import { PostSocialActions } from "@/components/profile/post-social-actions";
import { PostContextAnalysis } from "@/components/posts/post-context-analysis";
import { PostFeedImage } from "@/components/posts/post-feed-image";
import { parseXImageDimensions } from "@/lib/posts/post-image-display";
import type { PostCommentItem } from "@/components/profile/post-comments";
import type { PostTransmissionStats } from "@/lib/profiles/load-native-profile-intelligence";
import { cn } from "@/lib/utils";

type PostRow = Record<string, unknown> & {
  id: string;
  body: string;
  created_at: string;
  like_count?: number | null;
  image_paths?: string[] | null;
  external_source?: string | null;
  moderation_payload?: Record<string, unknown> | null;
};

type Props = {
  post: PostRow;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_path: string | null;
    kind: string | null;
  };
  profileName: string;
  postUrl: string;
  stats: PostTransmissionStats;
  autoQueued: boolean;
  comments: PostCommentItem[];
  liked: boolean;
  viewerId?: string;
  callbackUrl: string;
  canListenAudiopost: boolean;
  listenBlockedMessage?: string;
};

export function NativeTransmissionCard({
  post,
  profile,
  profileName,
  postUrl,
  stats,
  autoQueued,
  comments,
  liked,
  viewerId,
  callbackUrl,
  canListenAudiopost,
  listenBlockedMessage,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const createdAt = new Date(post.created_at);

  return (
    <article
      className={cn(
        "echonx-transmission group relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-black/40 p-5 backdrop-blur-xl transition-all duration-300",
        hovered && "border-cyan-400/35 shadow-[0_0_40px_-12px_hsl(188_94%_43%/0.45)]",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(188_94%_43%/0.08),transparent_45%)] opacity-0 transition-opacity group-hover:opacity-100" />

      <header className="relative flex items-start gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-cyan-500/30">
          {profile.avatar_path ? (
            <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="44px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900">
              <EchonXLogo size="mini" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-50">{profileName}</span>
            <span className="text-xs text-zinc-500">@{profile.username}</span>
          </div>
          <time className="text-xs text-zinc-500">
            {createdAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </div>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-200">
          {autoQueued ? "Auto signal" : "Manual listen"}
        </span>
      </header>

      <p className="relative mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-200/95">{post.body}</p>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        <PostContextAnalysis postId={post.id} isAuthenticated={!!viewerId} signInCallbackUrl={callbackUrl} />
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
          Context {stats.contextScore}
        </span>
        {stats.aiVerified ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300/90">
            <Sparkles className="h-3 w-3" aria-hidden />
            AI verified
          </span>
        ) : null}
      </div>

      {(post.image_paths as string[] | null)?.length ? (
        <div className="relative mt-4 space-y-3">
          {(post.image_paths as string[]).map((src, index) => (
            <PostFeedImage
              key={src}
              src={src}
              sizes="(max-width: 1024px) 100vw, 640px"
              externalSource={(post.external_source as string | null) ?? null}
              authorKind={profile.kind}
              dimensions={parseXImageDimensions(post.moderation_payload, index)}
            />
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "relative mt-4 flex h-8 items-end gap-0.5 overflow-hidden rounded-lg border border-cyan-500/10 bg-black/50 px-2 py-1 transition-opacity",
          hovered ? "opacity-100" : "opacity-40",
        )}
        aria-hidden
      >
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-cyan-400/70 animate-explore-wave"
            style={{
              height: `${30 + ((i * 7) % 18)}px`,
              animationDelay: `${(i % 8) * 0.08}s`,
            }}
          />
        ))}
      </div>

      <footer className="relative mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-4 text-[11px] text-zinc-500 sm:grid-cols-4">
        <div>
          <span className="block text-zinc-600">min heard</span>
          <span className="font-medium text-zinc-300">{stats.listenMinutes}</span>
        </div>
        <div>
          <span className="block text-zinc-600">completion</span>
          <span className="font-medium text-zinc-300">{stats.completionPercent}%</span>
        </div>
        <div>
          <span className="block text-zinc-600">interactions</span>
          <span className="font-medium text-zinc-300">{stats.interactions}</span>
        </div>
        <div>
          <span className="block text-zinc-600">context</span>
          <span className="font-medium text-cyan-300/90">{stats.contextScore}</span>
        </div>
      </footer>

      <div className="relative mt-4 space-y-3 border-t border-white/5 pt-4">
        <PostSocialActions
          postId={post.id}
          postUrl={postUrl}
          post={{
            authorName: profileName,
            username: profile.username,
            avatarPath: profile.avatar_path,
            body: post.body,
            createdAt: post.created_at,
            imagePaths: (post.image_paths as string[] | null) ?? [],
            likeCount: post.like_count ?? 0,
            liked,
            externalSource: (post.external_source as string | null) ?? null,
            authorKind: profile.kind,
            moderationPayload: post.moderation_payload ?? null,
          }}
          comments={comments}
          likeCount={post.like_count ?? 0}
          liked={liked}
          isAuthenticated={!!viewerId}
          signInCallbackUrl={callbackUrl}
        />
        <ListenButton
          text={post.body}
          autoQueued={autoQueued}
          listenAllowed={canListenAudiopost}
          listenBlockedMessage={listenBlockedMessage}
        />
        <Link href={postUrl} className="text-[11px] text-cyan-500/70 hover:text-cyan-400">
          Open transmission →
        </Link>
      </div>
    </article>
  );
}
