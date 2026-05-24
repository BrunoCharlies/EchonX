"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function consumeQueueRow(queueRowId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("listening_queue")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", queueRowId)
    .eq("listener_x_user_id", session.user.id);

  if (error?.code === "PGRST204") {
    const fallback = await supabase
      .from("listening_queue")
      .delete()
      .eq("id", queueRowId)
      .eq("listener_x_user_id", session.user.id);
    if (fallback.error) throw fallback.error;
    revalidatePath("/app");
    return;
  }
  if (error) throw error;
  revalidatePath("/app");
}

export async function logTextReadEvent(postId: string, charsCount: number) {
  return logTextReadEvents([{ postId, charsCount }]);
}

export async function logTextReadEvents(events: { postId: string; charsCount: number }[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!events.length) return;

  const supabase = createServiceRoleClient();
  const rows = events.map((event) => ({
    listener_x_user_id: session.user!.id,
    post_id: event.postId,
    chars_count: Math.max(0, Math.min(event.charsCount, 50_000)),
  }));

  const { error } = await supabase.from("text_read_events").insert(rows);
  if (error?.code === "PGRST205") return;
  if (error) throw error;
}
