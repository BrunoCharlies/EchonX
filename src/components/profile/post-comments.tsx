"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { PostFeedImage } from "@/components/posts/post-feed-image";
import { parseXImageDimensions } from "@/lib/posts/post-image-display";
import { Heart, Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LikeButton } from "@/components/profile/like-button";
import { createPostComment } from "@/server/actions/comments";
import { toggleCommentLike } from "@/server/actions/likes";

export type PostCommentItem = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  body: string;
  like_count?: number | null;
  viewer_liked?: boolean;
  created_at: string;
  profiles?: {
    username?: string | null;
    display_name?: string | null;
    avatar_path?: string | null;
  } | null;
};

type Props = {
  postId: string;
  comments: PostCommentItem[];
  isAuthenticated: boolean;
  signInCallbackUrl: string;
  renderComposer?: boolean;
};

export type CommentModalPost = {
  authorName: string;
  username: string;
  avatarPath?: string | null;
  body: string;
  createdAt: string;
  imagePaths: string[];
  likeCount: number;
  liked: boolean;
  externalSource?: string | null;
  authorKind?: string | null;
  moderationPayload?: Record<string, unknown> | null;
};

function sortByMostLiked(a: PostCommentItem, b: PostCommentItem) {
  const likeDiff = (b.like_count ?? 0) - (a.like_count ?? 0);
  if (likeDiff !== 0) return likeDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function PostComments({ postId, comments, isAuthenticated, signInCallbackUrl, renderComposer = true }: Props) {
  const topLevel = comments.filter((comment) => !comment.parent_comment_id).sort(sortByMostLiked);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MessageCircle className="h-4 w-4" />
        {comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "No comments yet"}
      </div>
      {renderComposer ? <CommentForm postId={postId} isAuthenticated={isAuthenticated} signInCallbackUrl={signInCallbackUrl} /> : null}
      {topLevel.length ? (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              allComments={comments}
              isAuthenticated={isAuthenticated}
              signInCallbackUrl={signInCallbackUrl}
              depth={0}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommentModal({
  postId,
  post,
  comments,
  isAuthenticated,
  signInCallbackUrl,
  open,
  onClose,
}: Props & { post?: CommentModalPost; open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close comments" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/70 bg-card p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Post comments</h2>
            <p className="text-xs text-muted-foreground">Most-liked comments appear first.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close comments" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {post ? (
          <div className="mb-5 rounded-2xl border border-border/70 bg-background/45 p-4">
            <div className="flex items-start gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
                {post.avatarPath ? (
                  <Image src={post.avatarPath} alt="" fill className="object-cover" sizes="40px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-1">
                    <EchonXLogo imageClassName="h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{post.authorName}</p>
                  <p className="text-xs text-muted-foreground">@{post.username}</p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(post.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{post.body}</p>
            {post.imagePaths.length ? (
              <div className="mt-3 space-y-3">
                {post.imagePaths.map((src, index) => (
                  <PostFeedImage
                    key={src}
                    src={src}
                    sizes="(max-width: 768px) 100vw, 672px"
                    externalSource={post.externalSource}
                    authorKind={post.authorKind}
                    dimensions={parseXImageDimensions(post.moderationPayload, index)}
                  />
                ))}
              </div>
            ) : null}
            <div className="mt-3 border-t border-border/60 pt-2">
              <LikeButton
                postId={postId}
                initialCount={post.likeCount}
                initialLiked={post.liked}
                isAuthenticated={isAuthenticated}
                signInCallbackUrl={signInCallbackUrl}
              />
            </div>
          </div>
        ) : null}
        <PostComments
          postId={postId}
          comments={comments}
          isAuthenticated={isAuthenticated}
          signInCallbackUrl={signInCallbackUrl}
          renderComposer
        />
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  allComments,
  isAuthenticated,
  signInCallbackUrl,
  depth,
}: {
  comment: PostCommentItem;
  allComments: PostCommentItem[];
  isAuthenticated: boolean;
  signInCallbackUrl: string;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const [liked, setLiked] = useState(Boolean(comment.viewer_liked));
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);
  const likeInFlight = useRef(false);
  const author = comment.profiles;
  const children = allComments.filter((child) => child.parent_comment_id === comment.id).sort(sortByMostLiked);
  const createdAt = new Date(comment.created_at);

  return (
    <div className={depth ? "ml-4 border-l border-border/60 pl-3" : ""}>
      <div className="flex gap-3">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/60 bg-secondary">
          {author?.avatar_path ? (
            <Image src={author.avatar_path} alt="" fill className="object-cover" sizes="32px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-1">
              <EchonXLogo imageClassName="h-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium text-foreground">{author?.display_name ?? author?.username ?? "Listener"}</p>
              <p className="text-[10px] text-muted-foreground">@{author?.username ?? "user"}</p>
              <p className="text-[10px] text-muted-foreground">
                {createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-foreground/90">{comment.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setReplying((value) => !value)}>
              Reply
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground transition-transform active:scale-95"
              onClick={() => {
                if (!isAuthenticated) {
                  window.location.href = `/login?callbackUrl=${encodeURIComponent(signInCallbackUrl)}`;
                  return;
                }
                if (likeInFlight.current) return;

                const previousLiked = liked;
                const previousCount = likeCount;
                const nextLiked = !liked;
                setLiked(nextLiked);
                setLikeCount((value) => Math.max(0, value + (nextLiked ? 1 : -1)));

                likeInFlight.current = true;
                void toggleCommentLike(comment.id)
                  .then((result) => {
                    setLiked(result.liked);
                    setLikeCount(result.likeCount);
                  })
                  .catch(() => {
                    setLiked(previousLiked);
                    setLikeCount(previousCount);
                  })
                  .finally(() => {
                    likeInFlight.current = false;
                  });
              }}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-[fill,color,transform] duration-150 ${liked ? "scale-110 fill-primary text-primary" : ""}`}
              />
              {likeCount}
            </Button>
          </div>
          {replying ? (
            <CommentForm
              postId={comment.post_id}
              parentCommentId={comment.id}
              isAuthenticated={isAuthenticated}
              signInCallbackUrl={signInCallbackUrl}
              onDone={() => setReplying(false)}
            />
          ) : null}
          {children.length ? (
            <div className="space-y-3 pt-2">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  allComments={allComments}
                  isAuthenticated={isAuthenticated}
                  signInCallbackUrl={signInCallbackUrl}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CommentForm({
  postId,
  parentCommentId,
  isAuthenticated,
  signInCallbackUrl,
  onDone,
}: {
  postId: string;
  parentCommentId?: string;
  isAuthenticated: boolean;
  signInCallbackUrl: string;
  onDone?: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData, form: HTMLFormElement) {
    setMessage(null);
    if (!isAuthenticated) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(signInCallbackUrl)}`;
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          formData.set("postId", postId);
          if (parentCommentId) formData.set("parentCommentId", parentCommentId);
          await createPostComment(formData);
          form.reset();
          onDone?.();
          window.location.reload();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to comment.");
        }
      })();
    });
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget), event.currentTarget);
      }}
    >
      <Textarea name="body" rows={2} maxLength={500} placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."} required />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground">Maximum 500 characters.</p>
        <Button type="submit" size="sm" className="gap-2" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </Button>
      </div>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </form>
  );
}
