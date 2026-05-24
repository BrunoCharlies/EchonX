import type { SupabaseClient } from "@supabase/supabase-js";

export type ListeningQueueEnqueueReason =
  | "new_since_subscription"
  | "x_realtime_import"
  | (string & {});

/**
 * Enqueues posts only if the listener has never consumed them (and has no read event).
 * Never resets consumed_at — sync/refresh must not re-open heard posts (avoids repeat TTS cost).
 */
export async function enqueueListeningPostsIfEligible(
  supabase: SupabaseClient,
  input: {
    listenerId: string;
    postIds: string[];
    reason: ListeningQueueEnqueueReason;
  },
): Promise<{ enqueued: number; skipped: number }> {
  const uniqueIds = [...new Set(input.postIds.filter((id) => typeof id === "string" && id.length > 0))];
  if (!uniqueIds.length) return { enqueued: 0, skipped: 0 };

  const { data: queueRows, error: queueErr } = await supabase
    .from("listening_queue")
    .select("post_id, consumed_at")
    .eq("listener_x_user_id", input.listenerId)
    .in("post_id", uniqueIds);

  if (queueErr && queueErr.code !== "PGRST205") throw queueErr;

  const blockedIds = new Set<string>();
  for (const row of queueRows ?? []) {
    const postId = row.post_id as string | undefined;
    if (!postId) continue;
    if (row.consumed_at) {
      blockedIds.add(postId);
      continue;
    }
    // Already pending — do not insert again.
    blockedIds.add(postId);
  }

  const { data: readRows, error: readErr } = await supabase
    .from("text_read_events")
    .select("post_id")
    .eq("listener_x_user_id", input.listenerId)
    .in("post_id", uniqueIds);

  if (readErr && readErr.code !== "PGRST205" && readErr.code !== "PGRST204") throw readErr;

  for (const row of readRows ?? []) {
    const postId = row.post_id as string | undefined;
    if (postId) blockedIds.add(postId);
  }

  const toInsert = uniqueIds.filter((id) => !blockedIds.has(id));
  const skipped = uniqueIds.length - toInsert.length;

  if (!toInsert.length) return { enqueued: 0, skipped };

  const { error: insertErr } = await supabase.from("listening_queue").insert(
    toInsert.map((post_id) => ({
      listener_x_user_id: input.listenerId,
      post_id,
      reason: input.reason,
    })),
  );

  if (insertErr) {
    // Race: another worker inserted the same row — treat as skipped, not fatal.
    if (insertErr.code === "23505") {
      return { enqueued: 0, skipped: uniqueIds.length };
    }
    throw insertErr;
  }

  return { enqueued: toInsert.length, skipped };
}
