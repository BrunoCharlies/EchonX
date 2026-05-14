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

  if (error) throw error;
  revalidatePath("/app");
}

export async function logTextReadEvent(postId: string, charsCount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("text_read_events").insert({
    listener_x_user_id: session.user.id,
    post_id: postId,
    chars_count: Math.max(0, Math.min(charsCount, 50_000)),
  });
  if (error) throw error;
}
