"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function createPostComment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sign in to comment.");

  const postId = String(formData.get("postId") ?? "");
  const parentCommentId = String(formData.get("parentCommentId") ?? "") || null;
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) throw new Error("Post not found.");
  if (!body) throw new Error("Comment text is required.");
  if (body.length > 500) throw new Error("Comments must be 500 characters or fewer.");

  const supabase = createServiceRoleClient();
  const uid = session.user.id;
  const { data: profileById, error: profileErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", uid)
    .maybeSingle();
  if (profileErr) throw profileErr;

  const { data: profileByOwner, error: ownerErr } = profileById
    ? { data: null, error: null }
    : await supabase.from("profiles").select("id").eq("owner_x_user_id", uid).maybeSingle();
  if (ownerErr) throw ownerErr;

  const profile = profileById ?? profileByOwner;
  if (!profile?.id) throw new Error("Profile not found.");

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, author_id, profiles!inner(username)")
    .eq("id", postId)
    .single();
  if (postErr || !post?.id) throw postErr ?? new Error("Post not found.");

  if (parentCommentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("post_comments")
      .select("id, post_id")
      .eq("id", parentCommentId)
      .eq("post_id", postId)
      .single();
    if (parentErr || !parent?.id) throw parentErr ?? new Error("Parent comment not found.");
  }

  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    parent_comment_id: parentCommentId,
    author_profile_id: profile.id,
    body,
  });
  if (error) throw error;

  const profileRow = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  if (profileRow?.username) {
    revalidatePath(`/u/${profileRow.username}`);
  }
}
