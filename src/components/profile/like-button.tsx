"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/server/actions/likes";
import { signIn } from "next-auth/react";

type Props = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  signInCallbackUrl: string;
};

export function LikeButton({ postId, initialCount, initialLiked, isAuthenticated, signInCallbackUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isAuthenticated) {
      void signIn("twitter", { callbackUrl: signInCallbackUrl });
      return;
    }
    startTransition(() => {
      void (async () => {
        await toggleLike(postId);
        router.refresh();
      })();
    });
  }

  return (
    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${initialLiked ? "fill-primary text-primary" : ""}`} />}
      {initialCount} {initialCount === 1 ? "like" : "likes"}
    </Button>
  );
}
