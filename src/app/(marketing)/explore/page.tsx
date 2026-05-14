import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,avatar_path,kind")
    .order("created_at", { ascending: false })
    .limit(48);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Explore profiles</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          EchonX is profile-first. Discover creators, open a public profile, and tap Want to Hear to opt into automatic
          listening for new posts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(profiles ?? []).map((profile) => (
          <Card key={profile.id} className="border-border/80 bg-card/70">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0">
              <Avatar className="h-12 w-12">
                {profile.avatar_path ? <AvatarImage src={profile.avatar_path} alt="" /> : null}
                <AvatarFallback>{(profile.display_name ?? profile.username).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{profile.display_name ?? `@${profile.username}`}</CardTitle>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {profile.kind === "native" ? "Native" : "External"}
                  </Badge>
                </div>
                <CardDescription>@{profile.username}</CardDescription>
                <p className="text-sm text-muted-foreground">{profile.bio ?? "No bio yet."}</p>
              </div>
            </CardHeader>
            <div className="flex items-center justify-between px-6 pb-6">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/u/${profile.username}`}>
                  View profile
                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
