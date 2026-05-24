import type { SupabaseClient } from "@supabase/supabase-js";
import { isAuthLinkedNativeProfile } from "@/lib/profiles/profile-kind";

/**
 * Fixes profiles tied to auth.users that were mislabeled `external_x` (e.g. after X import collision).
 */
export async function repairAuthLinkedProfileKind(
  supabase: SupabaseClient,
  profile: { id: string; kind?: string | null; owner_x_user_id?: string | null },
  authUserId: string,
): Promise<{ kind: string; repaired: boolean }> {
  const currentKind = profile.kind ?? "native";
  if (!isAuthLinkedNativeProfile(profile, authUserId)) {
    return { kind: currentKind, repaired: false };
  }
  if (currentKind === "native" || currentKind === "curator") {
    return { kind: currentKind, repaired: false };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      kind: "native",
      owner_x_user_id: authUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    console.error("[repair-profile-kind] could not repair profile", profile.id, error.message);
    return { kind: currentKind, repaired: false };
  }

  return { kind: "native", repaired: true };
}
