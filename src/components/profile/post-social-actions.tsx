"use client";

import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/profile/like-button";
import { CommentModal, type CommentModalPost, type PostCommentItem } from "@/components/profile/post-comments";

type Props = {
  postId: string;
  postUrl: string;
  post: CommentModalPost;
  comments: PostCommentItem[];
  likeCount: number;
  liked: boolean;
  isAuthenticated: boolean;
  signInCallbackUrl: string;
};

export function PostSocialActions({ postId, postUrl, post, comments, likeCount, liked, isAuthenticated, signInCallbackUrl }: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function sharePost() {
    const url = `${window.location.origin}${postUrl}`;
    if (navigator.share) {
      await navigator.share({ title: "EchonX post", url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 text-muted-foreground">
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => setCommentsOpen(true)}>
          <MessageCircle className="h-4 w-4" />
          {comments.length}
        </Button>
        <LikeButton
          postId={postId}
          initialCount={likeCount}
          initialLiked={liked}
          isAuthenticated={isAuthenticated}
          signInCallbackUrl={signInCallbackUrl}
          compact
        />
        <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => void sharePost()}>
          <Share2 className="h-4 w-4" />
          {copied ? "Copied" : "Share"}
        </Button>
      </div>
      <CommentModal
        postId={postId}
        post={{ ...post, likeCount, liked }}
        comments={comments}
        isAuthenticated={isAuthenticated}
        signInCallbackUrl={signInCallbackUrl}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    </>
  );
}
