import { createServiceRoleClient } from "@/lib/supabase/service";

export function normalizeHandle(raw?: string) {
  const base = (raw ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  if (base.length >= 3 && base.length <= 24) return base;
  return `user_${Math.random().toString(36).slice(2, 10)}`;
}

export async function pickUniqueUsername(supabase: ReturnType<typeof createServiceRoleClient>, desired: string) {
  let candidate = desired.slice(0, 24);
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.from("profiles").select("id").eq("username", candidate).maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${desired.slice(0, 18)}_${suffix}`.slice(0, 24);
  }
  return `u_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveAppRole(twitterUserId: string): "user" | "admin" {
  const admins =
    process.env.ECHONX_ADMIN_X_USER_IDS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return admins.includes(twitterUserId) ? "admin" : "user";
}

/** Admin allowlist for email/password accounts (comma-separated, case-insensitive). */
export function resolveEmailAppRole(email: string): "user" | "admin" {
  const normalized = email.trim().toLowerCase();
  const admins =
    process.env.ECHONX_ADMIN_EMAILS?.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];
  return admins.includes(normalized) ? "admin" : "user";
}

/**
 * Upserts the native EchonX profile row keyed by the X user id.
 * Runs on every successful OAuth callback (JWT "account" branch).
 */
export async function syncTwitterUserToSupabase(input: {
  twitterUserId: string;
  twitterUsername?: string;
  displayName?: string;
  profileImageUrl?: string;
}) {
  const supabase = createServiceRoleClient();
  const desired = normalizeHandle(input.twitterUsername ?? input.twitterUserId);
  const role = resolveAppRole(input.twitterUserId);

  const { data: existing, error: readErr } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("owner_x_user_id", input.twitterUserId)
    .maybeSingle();

  if (readErr) throw readErr;

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: input.displayName ?? null,
        role,
        kind: "native",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const username = await pickUniqueUsername(supabase, desired);
    const profileId = crypto.randomUUID();
    const { error } = await supabase.from("profiles").insert({
      id: profileId,
      owner_x_user_id: input.twitterUserId,
      username,
      display_name: input.displayName ?? null,
      bio: null,
      avatar_path: null,
      kind: "native",
      role,
    });
    if (error) throw error;
  }

  const { error: subErr } = await supabase.from("subscriptions").upsert(
    {
      owner_x_user_id: input.twitterUserId,
      plan: "free",
    },
    { onConflict: "owner_x_user_id" },
  );
  if (subErr) throw subErr;
}
