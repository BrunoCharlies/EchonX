"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";
import { FloatingListenPlayer } from "@/components/listen/floating-listen-player";

export type ListenQueueItem = {
  queueId: number;
  postId: string;
  body: string;
  authorUsername: string | null;
  createdAt: string;
};

type ListenQueueContextValue = {
  items: ListenQueueItem[];
  refresh: () => Promise<void>;
};

const ListenQueueContext = createContext<ListenQueueContextValue | null>(null);

export function useListenQueue() {
  const ctx = useContext(ListenQueueContext);
  if (!ctx) {
    throw new Error("useListenQueue must be used within ListenQueueProvider");
  }
  return ctx;
}

/**
 * Keeps the listening queue in sync with Supabase Realtime and exposes data to the floating player.
 */
export function ListenQueueProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<ListenQueueItem[]>([]);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    const res = await fetch("/api/listening/queue", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { items?: ListenQueueItem[] };
    setItems(json.items ?? []);
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`listening-queue:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "listening_queue",
          filter: `listener_x_user_id=eq.${session.user.id}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [status, session?.user?.id, refresh]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const id = setInterval(() => {
      void fetch("/api/presence/heartbeat", { method: "POST" });
    }, 60_000);
    void fetch("/api/presence/heartbeat", { method: "POST" });
    return () => clearInterval(id);
  }, [status]);

  const value = useMemo(() => ({ items, refresh }), [items, refresh]);

  return (
    <ListenQueueContext.Provider value={value}>
      {children}
      {status === "authenticated" ? <FloatingListenPlayer /> : null}
    </ListenQueueContext.Provider>
  );
}
