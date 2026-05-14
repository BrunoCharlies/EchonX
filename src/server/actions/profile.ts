"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { moderateImageWithEdgeOrFallback } from "@/lib/moderation-edge";
import { createServiceRoleClient } from "@/lib/supabase/service";

const usernameRegex = /^[a-z0-9_]{3,24}$/;

export async function updateNativeProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const bio = String(formData.get("bio") ?? "");
  const avatar = formData.get("avatar");

  if (!usernameRegex.test(username)) {
    throw new Error("Usernames must be 3-24 characters: lowercase letters, numbers, or underscores.");
  }

  const supabase = createServiceRoleClient();
  const uid = session.user.id;

  const { data: profile, error: readErr } = await supabase
    .from("profiles")
    .select("id,username,avatar_path")
    .eq("owner_x_user_id", uid)
    .single();

  if (readErr || !profile) throw new Error("Profile not found");

  if (username !== profile.username) {
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken && taken.id !== profile.id) {
      throw new Error("That username is already taken.");
    }
  }

  let avatarUrl: string | null = profile.avatar_path;

  if (avatar instanceof File && avatar.size > 0) {
    const bytes = Buffer.from(await avatar.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error("Avatar exceeds 2 MB after compression.");
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, avatar.type || "image/webp");
    if (!moderation.ok) {
      throw new Error("Avatar did not pass automatic moderation.");
    }

    const path = `${uid}/avatar.webp`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = pub.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      bio: bio || null,
      avatar_path: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) throw error;

  revalidatePath("/app/onboarding");
  revalidatePath("/profile");
  revalidatePath(`/u/${username}`);
}

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("profiles").select("*").eq("owner_x_user_id", session.user.id).maybeSingle();
  return data;
}
