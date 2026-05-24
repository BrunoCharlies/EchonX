"use server";

import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type LikeToggleResult = {
  liked: boolean;
  likeCount: number;
};

async function readPostLikeCount(postId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("like_count").eq("id", postId).maybeSingle();
  if (error) throw error;
  return data?.like_count ?? 0;
}

export async function toggleLike(postId: string): Promise<LikeToggleResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in to like posts.");

  const liker = session.user.id;
  const supabase = await createClient();

  const { data: existing, error: readErr } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("liker_x_user_id", liker)
    .maybeSingle();

  if (readErr) throw readErr;

  let liked: boolean;

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("liker_x_user_id", liker);
    if (error) await toggleLikeWithServiceRole(postId, liker, true);
    liked = false;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, liker_x_user_id: liker });
    if (error) await toggleLikeWithServiceRole(postId, liker, false);
    liked = true;
  }

  const likeCount = await readPostLikeCount(postId);
  return { liked, likeCount };
}

async function toggleLikeWithServiceRole(postId: string, liker: string, wasLiked: boolean) {
  const supabase = createServiceRoleClient();

  if (wasLiked) {
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
}

export async function toggleCommentLike(commentId: string): Promise<LikeToggleResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in to like comments.");

  const liker = session.user.id;
  const supabase = await createClient();

  const { data: existing, error: readErr } = await supabase
    .from("post_comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("liker_x_user_id", liker)
    .maybeSingle();

  if (readErr) throw readErr;

  let liked: boolean;

  if (existing) {
    const { error } = await supabase
      .from("post_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("liker_x_user_id", liker);
    if (error) {
      await toggleCommentLikeWithServiceRole(commentId, liker, true);
    }
    liked = false;
  } else {
    const { error } = await supabase.from("post_comment_likes").insert({ comment_id: commentId, liker_x_user_id: liker });
    if (error) {
      await toggleCommentLikeWithServiceRole(commentId, liker, false);
    }
    liked = true;
  }

  const { data: comment, error: commentErr } = await supabase
    .from("post_comments")
    .select("like_count")
    .eq("id", commentId)
    .maybeSingle();
  if (commentErr) throw commentErr;

  return { liked, likeCount: comment?.like_count ?? 0 };
}

async function toggleCommentLikeWithServiceRole(commentId: string, liker: string, wasLiked: boolean) {
  const supabase = createServiceRoleClient();

  if (wasLiked) {
    const { error } = await supabase
      .from("post_comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("liker_x_user_id", liker);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_comment_likes").insert({ comment_id: commentId, liker_x_user_id: liker });
    if (error) throw error;
  }

  const { count, error: countErr } = await supabase
    .from("post_comment_likes")
    .select("*", { count: "exact", head: true })
    .eq("comment_id", commentId);
  if (countErr) throw countErr;

  const { error: updErr } = await supabase.from("post_comments").update({ like_count: count ?? 0 }).eq("id", commentId);
  if (updErr) throw updErr;
}
