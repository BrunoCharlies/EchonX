"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import { Headphones } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { normalizeMirroredPostBodyForListen } from "@/lib/voice/post-announcement";
import { FloatingListenPlayer } from "@/components/listen/floating-listen-player";
import { getAudiopostVoiceEngine } from "@/lib/voice/audiopost-voice-session";

/** Safety-net poll when Realtime is healthy (new items still arrive via WS + manual refresh). */
const QUEUE_POLL_WHEN_REALTIME_MS = 120_000;
/** Poll faster if Realtime is not subscribed (e.g. publication not enabled in Supabase). */
const QUEUE_POLL_WITHOUT_REALTIME_MS = 25_000;
export type ListenQueueItem = {
  queueId: number;
  postId: string;
  body: string;
  /** Normalized intro for UI (e.g. Post by …); falls back to body when absent. */
  displayBody?: string;
  authorProfileId: string | null;
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
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ListenQueueItem[]>([]);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const isAudiopostHome = pathname === "/app";
  const isExploreFeed = pathname === "/app/explore";
  const isAdminVoiceLab = pathname === "/admin/lab/voice";
  const showAudiopostControl =
    pathname === "/app" ||
    pathname.startsWith("/app/") ||
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    isAdminVoiceLab;
  const useFloatingPlayer = showAudiopostControl && !isAudiopostHome && !isAdminVoiceLab;

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!showAudiopostControl) {
      setItems([]);
      return;
    }
    const res = await fetch(`/api/listening/queue?_=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { items?: ListenQueueItem[] };
    startTransition(() => {
      setItems(
        (json.items ?? []).map((item) => {
          const body = normalizeMirroredPostBodyForListen(item.body ?? "");
          return { ...item, body, displayBody: body };
        }),
      );
    });
  }, [showAudiopostControl]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!showAudiopostControl) return;
    void refresh();
    if (!playerOpen && !isAdminVoiceLab) return;
    const pollMs = realtimeConnected ? QUEUE_POLL_WHEN_REALTIME_MS : QUEUE_POLL_WITHOUT_REALTIME_MS;
    const id = setInterval(() => {
      void refresh();
    }, pollMs);
    return () => clearInterval(id);
  }, [isAdminVoiceLab, playerOpen, realtimeConnected, refresh, showAudiopostControl]);

  useEffect(() => {
    if (!showAudiopostControl) {
      setPlayerOpen(false);
    }
  }, [showAudiopostControl]);

  useEffect(() => {
    if (!userId || !showAudiopostControl) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`listening-queue:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "listening_queue",
          filter: `listener_x_user_id=eq.${userId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      setRealtimeConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [showAudiopostControl, userId, refresh]);

  useEffect(() => {
    if (!userId || !showAudiopostControl) return;
    const id = setInterval(() => {
      void fetch("/api/presence/heartbeat", { method: "POST" });
    }, 60_000);
    void fetch("/api/presence/heartbeat", { method: "POST" });
    return () => clearInterval(id);
  }, [showAudiopostControl, userId]);

  const value = useMemo(() => ({ items, refresh }), [items, refresh]);

  return (
    <ListenQueueContext.Provider value={value}>
      {children}
      {portalReady && useFloatingPlayer && playerOpen
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-[55]">
              <FloatingListenPlayer
                className="pointer-events-auto"
                onClose={() => setPlayerOpen(false)}
                defaultPlacement={isExploreFeed ? "feed-top" : "bottom-right"}
                resetPositionOnMount={isExploreFeed}
                getVoiceEngine={getAudiopostVoiceEngine}
                defaultPlaybackLanguage="original"
              />
            </div>,
            document.body,
          )
        : null}
      {useFloatingPlayer && !playerOpen ? (
        <Button
          type="button"
          className="fixed bottom-4 right-4 z-[60] gap-2 rounded-full px-4 shadow-2xl shadow-primary/20"
          onClick={() => {
            setPlayerOpen(true);
            void refresh();
          }}
        >
          <Headphones className="h-4 w-4" />
          Initiate Audiopost
        </Button>
      ) : null}
    </ListenQueueContext.Provider>
  );
}
