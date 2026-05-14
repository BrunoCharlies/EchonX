import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ListenButton } from "@/components/app/listen-button";
import { LikeButton } from "@/components/profile/like-button";
import { PostsLive } from "@/components/profile/posts-live";
import { WantToHearButton } from "@/components/profile/want-to-hear-button";
import { PostComposer } from "@/components/app/post-composer";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const handle = username.toLowerCase();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("username,display_name,bio").eq("username", handle).maybeSingle();
  if (!data) return { title: "Profile" };
  return {
    title: `${data.display_name ?? `@${data.username}`} on EchonX`,
    description: data.bio ?? "Public EchonX profile",
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const handle = username.toLowerCase();
  const supabase = await createClient();

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", handle).maybeSingle();
  if (error || !profile) {
    notFound();
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  const session = await auth();
  const viewerId = session?.user?.id;

  const postIds = posts?.map((p) => p.id) ?? [];
  const liked = new Set<string>();
  if (viewerId && postIds.length) {
    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds)
      .eq("liker_x_user_id", viewerId);
    likes?.forEach((l) => liked.add(l.post_id));
  }

  let subscribed = false;
  let listeningSinceIso: string | null = null;
  if (viewerId) {
    const { data: row } = await supabase
      .from("want_to_hear")
      .select("listening_since")
      .eq("listener_x_user_id", viewerId)
      .eq("target_profile_id", profile.id)
      .maybeSingle();
    subscribed = !!row;
    listeningSinceIso = row?.listening_since ?? null;
  }

  const listeningSince = listeningSinceIso ? new Date(listeningSinceIso) : null;
  const isOwnProfile = !!viewerId && viewerId === profile.owner_x_user_id;
  const callbackUrl = `/u/${profile.username}`;

  return (
    <div className="space-y-8">
      <PostsLive authorProfileId={profile.id} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
            {profile.avatar_path ? (
              <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{profile.display_name ?? `@${profile.username}`}</h1>
              <Badge variant={profile.kind === "native" ? "default" : "secondary"}>
                {profile.kind === "native" ? "Native profile" : "External X profile"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.bio ? <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{profile.bio}</p> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!isOwnProfile ? (
            <WantToHearButton
              profileId={profile.id}
              initialSubscribed={subscribed}
              isAuthenticated={!!viewerId}
              signInCallbackUrl={callbackUrl}
            />
          ) : (
            <Button size="lg" variant="outline" className="sm:min-w-[200px]" asChild>
              <a href="/app/onboarding">Edit profile</a>
            </Button>
          )}
          <Button size="lg" variant="outline" className="sm:min-w-[200px]" asChild>
            <a href="/pricing">View plans</a>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Posts</h2>
            <p className="text-xs text-muted-foreground">Public · moderated images · likes enabled</p>
          </div>
          {(posts ?? []).length === 0 ? (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">No posts yet</CardTitle>
                <CardDescription>When this creator publishes, you will see text and up to four images here.</CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(posts ?? []).map((post) => {
            const createdAt = new Date(post.created_at);
            const autoQueued = subscribed && listeningSince ? createdAt >= listeningSince : false;
            return (
              <Card key={post.id} className="border-border/80 bg-card/70">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-medium">
                      {createdAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {autoQueued ? "Auto-queue eligible" : "Manual listen"}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm text-foreground/90">{post.body}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(post.image_paths as string[] | null)?.length ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(post.image_paths as string[]).map((src) => (
                        <div key={src} className="relative aspect-square overflow-hidden rounded-md border border-border/60">
                          <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 120px" unoptimized />
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <LikeButton
                      postId={post.id}
                      initialCount={post.like_count ?? 0}
                      initialLiked={liked.has(post.id)}
                      isAuthenticated={!!viewerId}
                      signInCallbackUrl={callbackUrl}
                    />
                    <ListenButton text={post.body} autoQueued={autoQueued} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          {isOwnProfile ? <PostComposer /> : null}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pro audio comments</CardTitle>
              <CardDescription>Voice replies are gated to the Pro plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" disabled>
                Record audio comment (Pro)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
