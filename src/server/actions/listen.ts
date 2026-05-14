"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function toggleWantToHear(targetProfileId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = createServiceRoleClient();
  const listener = session.user.id;

  const { data: target } = await supabase.from("profiles").select("owner_x_user_id").eq("id", targetProfileId).single();
  if (!target) throw new Error("Profile not found");
  if (target.owner_x_user_id === listener) {
    throw new Error("You cannot subscribe to your own profile.");
  }

  const { data: existing } = await supabase
    .from("want_to_hear")
    .select("target_profile_id")
    .eq("listener_x_user_id", listener)
    .eq("target_profile_id", targetProfileId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("want_to_hear")
      .delete()
      .eq("listener_x_user_id", listener)
      .eq("target_profile_id", targetProfileId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("want_to_hear").insert({
      listener_x_user_id: listener,
      target_profile_id: targetProfileId,
      listening_since: new Date().toISOString(),
    });
    if (error) throw error;
  }

  const { data: handleRow } = await supabase.from("profiles").select("username").eq("id", targetProfileId).single();
  if (handleRow?.username) {
    revalidatePath(`/u/${handleRow.username}`);
  }
}
