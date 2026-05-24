"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  onNewPost?: () => void;
};

/**
 * Notifies the Explore feed when new native posts arrive (banner + manual refresh).
 */
export function ExploreFeedLive({ onNewPost }: Props) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("explore-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        () => {
          onNewPost?.();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onNewPost]);

  return null;
}
