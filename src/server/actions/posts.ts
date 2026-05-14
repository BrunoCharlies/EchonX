"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { moderateImageWithEdgeOrFallback } from "@/lib/moderation-edge";
import { createServiceRoleClient } from "@/lib/supabase/service";

const MAX_IMAGES = 4;

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Post text is required.");
  if (body.length > 5000) throw new Error("Post text is too long.");

  const files = formData
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (files.length > MAX_IMAGES) {
    throw new Error(`You can attach up to ${MAX_IMAGES} images.`);
  }

  const supabase = createServiceRoleClient();
  const uid = session.user.id;

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("owner_x_user_id", uid)
    .single();

  if (profErr || !profile) throw new Error("Profile not found");

  const { data: inserted, error: insErr } = await supabase
    .from("posts")
    .insert({
      author_id: profile.id,
      body,
      image_paths: [] as string[],
      moderation_payload: null,
    })
    .select("id")
    .single();

  if (insErr || !inserted) throw insErr ?? new Error("Unable to create post");

  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error("An image exceeds 2 MB after compression.");
    }
    const moderation = await moderateImageWithEdgeOrFallback(bytes, file.type || "image/webp");
    if (!moderation.ok) {
      throw new Error("An image did not pass automatic moderation.");
    }

    const path = `${inserted.id}/${i}.webp`;
    const { error: upErr } = await supabase.storage.from("post-images").upload(path, bytes, {
      contentType: "image/webp",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  const { error: updErr } = await supabase.from("posts").update({ image_paths: urls }).eq("id", inserted.id);
  if (updErr) throw updErr;

  const { data: handleRow } = await supabase.from("profiles").select("username").eq("id", profile.id).single();
  if (handleRow?.username) {
    revalidatePath(`/u/${handleRow.username}`);
  }
}
