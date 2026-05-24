import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

type ProfileSearchRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_path: string | null;
  kind: string | null;
  created_at: string | null;
};

function initials(displayName: string | null, username: string) {
  return (displayName ?? username).slice(0, 2).toUpperCase();
}

function normalizeSearch(value: string | undefined) {
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

function searchTokens(query: string) {
  if (!query) return [];
  const withoutAt = normalizeComparable(query.replace(/^@/, ""));
  const withoutXPrefix = withoutAt.replace(/^x_/, "");
  return Array.from(new Set([withoutAt, withoutXPrefix, `x_${withoutXPrefix}`].filter((token) => token.length >= 2)));
}

function matchesProfile(profile: ProfileSearchRow, tokens: string[]) {
  return scoreProfile(profile, tokens) > 0;
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

function scoreProfile(profile: ProfileSearchRow, tokens: string[]) {
  if (!tokens.length) return 1;
  const haystack = [profile.username, profile.username.replace(/^x_/, ""), profile.display_name]
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => {
      const normalized = normalizeComparable(value);
      return [normalized, normalized.replace(/^x_/, "")];
    });

  return Math.max(...tokens.flatMap((token) => haystack.map((value) => similarityScore(value, token))), 0);
}

export default async function DiscoverProfilesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = normalizeSearch(q);
  const tokens = searchTokens(query);
  const supabase = createServiceRoleClient();

  const baseSelect = "id, username, display_name, bio, avatar_path, kind, created_at";
  const { data: profileRows, error } = await supabase
    .from("profiles")
    .select(baseSelect)
    .order("created_at", { ascending: false })
    .limit(tokens.length ? 5000 : 60);

  if (error) {
    console.error("[discover] profiles search failed", error);
  }
  const profiles = ((profileRows ?? []) as ProfileSearchRow[])
    .map((profile) => ({ profile, score: scoreProfile(profile, tokens) }))
    .filter(({ profile, score }) => (!tokens.length ? matchesProfile(profile, tokens) : score > 0))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.profile.created_at ?? 0).getTime() - new Date(a.profile.created_at ?? 0).getTime();
    })
    .map(({ profile }) => profile)
    .slice(0, 60);

  const searchedWithoutResult = query && profiles.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:p-5">
        <div>
          <Badge variant="secondary" className="mb-3 border border-border/70">
            Universal profile search
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Discover profiles</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Search people registered on EchonX by name or username, open their profile, and choose who you want to hear.
          </p>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" action="/app/discover">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={query} placeholder="Search @username, username, or display name" className="pl-9" />
          </div>
          <Button type="submit" className="shrink-0">
            Search
          </Button>
          {query ? (
            <Button type="button" variant="outline" className="shrink-0" asChild>
              <Link href="/app/discover">Clear</Link>
            </Button>
          ) : null}
        </form>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Profiles</h2>
          <p className="text-xs text-muted-foreground">
            {query ? `Results for "${query}"` : "Recently registered profiles"}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">
          {profiles.length} shown
        </Badge>
      </div>

      {profiles.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="border-border/80 bg-card/70">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <Avatar className="h-12 w-12 border border-border/70">
                  {profile.avatar_path ? <AvatarImage src={profile.avatar_path} alt="" /> : null}
                  <AvatarFallback>{initials(profile.display_name, profile.username)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <CardTitle className="truncate text-base">{profile.display_name ?? `@${profile.username}`}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {profile.kind === "native" ? "Native" : "External"}
                    </Badge>
                  </div>
                  <CardDescription>@{profile.username}</CardDescription>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{profile.bio ?? "No bio yet."}</p>
                </div>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/u/${profile.username}`}>
                    View profile
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/80 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">No profiles found</CardTitle>
            <CardDescription>
              {searchedWithoutResult
                ? "No username or display name matched your search. Try without @, or search part of the name."
                : "Try another name or username."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
