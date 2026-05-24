"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/server/actions/likes";

type Props = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  signInCallbackUrl: string;
  compact?: boolean;
};

export function LikeButton({ postId, initialCount, initialLiked, isAuthenticated, signInCallbackUrl, compact = false }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const inFlight = useRef(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialCount, initialLiked, postId]);

  function onClick() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(signInCallbackUrl)}`);
      return;
    }
    if (inFlight.current) return;

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !liked;

    setLiked(nextLiked);
    setCount((value) => Math.max(0, value + (nextLiked ? 1 : -1)));

    inFlight.current = true;
    void toggleLike(postId)
      .then((result) => {
        setLiked(result.liked);
        setCount(result.likeCount);
      })
      .catch(() => {
        setLiked(previousLiked);
        setCount(previousCount);
      })
      .finally(() => {
        inFlight.current = false;
      });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-muted-foreground transition-transform active:scale-95"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike post" : "Like post"}
    >
      <Heart
        className={`h-4 w-4 transition-[fill,color,transform] duration-150 ${liked ? "scale-110 fill-primary text-primary" : ""}`}
      />
      {compact ? count : `${count} ${count === 1 ? "like" : "likes"}`}
    </Button>
  );
}
