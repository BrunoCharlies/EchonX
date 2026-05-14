"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  authorProfileId: string;
};

/**
 * Subscribes to Supabase Realtime inserts for new posts on this profile.
 * When a row arrives, we refresh the current route so RSC re-fetches data.
 */
export function PostsLive({ authorProfileId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`posts:${authorProfileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `author_id=eq.${authorProfileId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authorProfileId, router]);

  return null;
}
