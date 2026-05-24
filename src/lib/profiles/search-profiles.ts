import { createServiceRoleClient } from "@/lib/supabase/service";

export type ProfileSearchRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  kind: string | null;
  created_at: string | null;
};

export function normalizeProfileSearchQuery(value: string | undefined) {
  return (value ?? "").replace(/^@/, "").trim().toLowerCase().slice(0, 60);
}

function normalizeComparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9_]/g, "")
    .toLowerCase();
}

export function profileSearchTokens(query: string) {
  if (!query) return [];
  const withoutAt = normalizeComparable(query.replace(/^@/, ""));
  const withoutXPrefix = withoutAt.replace(/^x_/, "");
  return Array.from(new Set([withoutAt, withoutXPrefix, `x_${withoutXPrefix}`].filter((token) => token.length >= 2)));
}

function similarityScore(value: string, token: string) {
  if (!value || !token) return 0;
  if (value === token) return 120;
  if (value.startsWith(token)) return 95;
  if (value.includes(token)) return 70;
  if (token.includes(value) && value.length >= 3) return 45;

  let sequentialMatches = 0;
  let searchIndex = 0;
  for (const char of token) {
    const foundAt = value.indexOf(char, searchIndex);
    if (foundAt === -1) continue;
    sequentialMatches++;
    searchIndex = foundAt + 1;
  }

  const ratio = sequentialMatches / token.length;
  return ratio >= 0.7 ? Math.round(35 * ratio) : 0;
}

export function scoreProfile(profile: ProfileSearchRow, tokens: string[]) {
  if (!tokens.length) return 1;
  const haystack = [profile.username, profile.username.replace(/^x_/, ""), profile.display_name]
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => {
      const normalized = normalizeComparable(value);
      return [normalized, normalized.replace(/^x_/, "")];
    });

  return Math.max(...tokens.flatMap((token) => haystack.map((value) => similarityScore(value, token))), 0);
}

export async function searchProfiles(options: {
  query: string;
  nativeOnly?: boolean;
  limit?: number;
}): Promise<ProfileSearchRow[]> {
  const query = normalizeProfileSearchQuery(options.query);
  const tokens = profileSearchTokens(query);
  const limit = options.limit ?? 8;

  if (!tokens.length) return [];

  const supabase = createServiceRoleClient();
  let request = supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_path, kind, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (options.nativeOnly) {
    request = request.eq("kind", "native");
  }

  const { data: profileRows, error } = await request;
  if (error) {
    console.error("[profiles/search]", error.message);
    return [];
  }

  return ((profileRows ?? []) as ProfileSearchRow[])
    .map((profile) => ({ profile, score: scoreProfile(profile, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.profile.created_at ?? 0).getTime() - new Date(a.profile.created_at ?? 0).getTime();
    })
    .map(({ profile }) => profile)
    .slice(0, limit);
}
