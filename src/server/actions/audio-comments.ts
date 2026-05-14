"use server";

import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function assertProForAudio() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("subscriptions").select("plan").eq("owner_x_user_id", session.user.id).single();

  if (data?.plan !== "pro") {
    throw new Error("Audio comments are exclusive to the Pro plan.");
  }
}
