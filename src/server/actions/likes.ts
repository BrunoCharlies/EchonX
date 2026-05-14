"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function toggleLike(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = createServiceRoleClient();
  const liker = session.user.id;

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("liker_x_user_id", liker)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("liker_x_user_id", liker);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, liker_x_user_id: liker });
    if (error) throw error;
  }

  const { count, error: countErr } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (countErr) throw countErr;

  const { error: updErr } = await supabase.from("posts").update({ like_count: count ?? 0 }).eq("id", postId);
  if (updErr) throw updErr;

  const { data: post } = await supabase.from("posts").select("author_id").eq("id", postId).single();
  if (post?.author_id) {
    const { data: handleRow } = await supabase.from("profiles").select("username").eq("id", post.author_id).single();
    if (handleRow?.username) {
      revalidatePath(`/u/${handleRow.username}`);
    }
  }
}
