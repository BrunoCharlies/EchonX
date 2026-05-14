import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyProfile } from "@/server/actions/profile";

export default async function AppHomePage() {
  const session = await auth();
  const profile = await getMyProfile();

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-3 border border-border/70">
          <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
          Profile-first workspace
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, {session?.user?.name ?? "creator"}.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Your X id <span className="font-mono text-xs text-foreground/80">{session?.user?.id}</span> is linked. Finish
          your native EchonX profile, publish up to four images per post, and invite listeners to tap Want to Hear.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Complete onboarding</CardTitle>
            <CardDescription>Avatar, bio, and @username in one guided flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/app/onboarding">Continue setup</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Discover profiles</CardTitle>
            <CardDescription>No global feed—only intentional follows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/explore">Browse creators</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preview your public profile</CardTitle>
            <CardDescription>Want to Hear, Listen, likes, and realtime updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href={profile ? `/u/${profile.username}` : "/app/onboarding"}>
                {profile ? `Open @${profile.username}` : "Finish profile setup"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
