import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminMemberRecord = {
  id: string;
  username: string | null;
  displayName: string | null;
  email: string | null;
  role: "user" | "admin";
  kind: string;
  createdAt: string;
  lastSeenAt: string | null;
  profileHref: string | null;
};

export type AdminMembersPayload = {
  generatedAt: string;
  total: number;
  recent: AdminMemberRecord[];
  members: AdminMemberRecord[];
};

function throwSupabaseError(error: { message: string }): never {
  throw new Error(error.message);
}

function mapProfileRow(
  row: Record<string, unknown>,
  emailByProfile: Map<string, string>,
): AdminMemberRecord {
  const id = String(row.id);
  const username = typeof row.username === "string" ? row.username.trim() || null : null;
  return {
    id,
    username,
    displayName:
      typeof row.display_name === "string" ? row.display_name.trim() || null : null,
    email: emailByProfile.get(id) ?? null,
    role: row.role === "admin" ? "admin" : "user",
    kind: String(row.kind ?? "native"),
    createdAt: String(row.created_at),
    lastSeenAt: typeof row.last_seen_at === "string" ? row.last_seen_at : null,
    profileHref: username ? `/u/${encodeURIComponent(username)}` : null,
  };
}

/** Resolve member emails via Supabase Auth; optional legacy `email_credentials` fallback. */
async function loadMemberEmails(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, string>> {
  const wanted = new Set(profileIds);
  const map = new Map<string, string>();
  if (wanted.size === 0) return map;

  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throwSupabaseError(error);
    for (const user of data.users) {
      if (user.email && wanted.has(user.id)) {
        map.set(user.id, user.email);
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }

  const missing = profileIds.filter((id) => !map.has(id));
  if (missing.length === 0) return map;

  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    const { data: creds, error: credError } = await supabase
      .from("email_credentials")
      .select("profile_id, email")
      .in("profile_id", chunk);
    if (credError) {
      const msg = credError.message ?? "";
      if (credError.code === "42P01" || /email_credentials|does not exist/i.test(msg)) {
        break;
      }
      throwSupabaseError(credError);
    }
    for (const c of creds ?? []) {
      map.set(String(c.profile_id), String(c.email));
    }
  }

  return map;
}

/** Native platform signups (email / Supabase auth), newest first. */
export async function loadAdminMembers(supabase: SupabaseClient): Promise<AdminMembersPayload> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, role, kind, created_at, last_seen_at")
    .eq("kind", "native")
    .order("created_at", { ascending: false });

  if (error) throwSupabaseError(error);

  const rows = profiles ?? [];
  const ids = rows.map((r) => String(r.id));
  const emailByProfile = await loadMemberEmails(supabase, ids);
  const members = rows.map((row) => mapProfileRow(row as Record<string, unknown>, emailByProfile));

  return {
    generatedAt: new Date().toISOString(),
    total: members.length,
    recent: members.slice(0, 5),
    members,
  };
}
