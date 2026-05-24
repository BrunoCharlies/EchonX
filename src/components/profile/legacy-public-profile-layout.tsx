import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { ListenButton } from "@/components/app/listen-button";
import { NewPostPanel } from "@/components/profile/new-post-panel";
import { type PostCommentItem } from "@/components/profile/post-comments";
import { PostSocialActions } from "@/components/profile/post-social-actions";
import { PostsLive } from "@/components/profile/posts-live";
import { WantToHearButton } from "@/components/profile/want-to-hear-button";
import { OfficialChannelBadge, isCuratorProfile } from "@/components/profile/official-channel-badge";
import { PostFeedImage } from "@/components/posts/post-feed-image";
import { PostContextAnalysis } from "@/components/posts/post-context-analysis";
import { parseXImageDimensions } from "@/lib/posts/post-image-display";
import type { PublicProfileRow } from "@/lib/profiles/load-public-profile";

type LegacyPublicProfileLayoutProps = {
  profile: PublicProfileRow;
  posts: Awaited<ReturnType<typeof import("@/lib/profiles/load-public-profile").loadPublicPostsByAuthorId>>;
  comments: PostCommentItem[];
  liked: Set<string>;
  subscribed: boolean;
  listeningSince: Date | null;
  canListenAudiopost: boolean;
  listenBlockedMessage?: string;
  viewerId?: string;
  isOwnProfile: boolean;
  isCurator: boolean;
  isQubic: boolean;
  curatorLabel: string;
  callbackUrl: string;
  profileName: string;
  postCount: number;
  totalLikes: number;
  joinedAt: Date | null;
  coverPath: string | null;
  t: { explore: { follow: string; following: string } };
};

/** Original public profile layout — used for external_x and curator profiles. */
export function LegacyPublicProfileLayout({
  profile,
  posts,
  comments,
  liked,
  subscribed,
  listeningSince,
  canListenAudiopost,
  listenBlockedMessage,
  viewerId,
  isOwnProfile,
  isCurator,
  isQubic,
  curatorLabel,
  callbackUrl,
  profileName,
  postCount,
  totalLikes,
  joinedAt,
  coverPath,
  t,
}: LegacyPublicProfileLayoutProps) {
  return (
    <div className="bg-background">
      <PostsLive authorProfileId={profile.id} />

      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,hsl(var(--card)/0.72),transparent)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/50">
            <div className="relative h-36 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.35),transparent_28%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--background)))] sm:h-48">
              {coverPath ? (
                <Image src={coverPath} alt="" fill className="object-cover" sizes="100vw" unoptimized />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/10 to-transparent" />
            </div>
            <div className="flex flex-col gap-5 p-5 pt-0 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pt-0">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-background bg-secondary shadow-xl shadow-background/40">
                  {profile.avatar_path ? (
                    <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="112px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
                  )}
                </div>
                <div className="space-y-2 pt-12 sm:pt-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{profileName}</h1>
                    {isCurator ? (
                      <OfficialChannelBadge ownerKey={profile.owner_x_user_id} username={profile.username} />
                    ) : (
                      <Badge variant={profile.kind === "native" ? "default" : "secondary"}>
                        {profile.kind === "native" ? "Native profile" : "External X profile"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {profile.bio || "This profile is getting ready to publish audio-friendly updates."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-0 sm:min-w-[220px] sm:pt-12">
                {!isOwnProfile ? (
                  <WantToHearButton
                    profileId={profile.id}
                    initialSubscribed={subscribed}
                    isAuthenticated={!!viewerId}
                    signInCallbackUrl={callbackUrl}
                    labelFollow={t.explore.follow}
                    labelFollowing={t.explore.following}
                  />
                ) : (
                  <Button size="lg" variant="outline" className="w-full" asChild>
                    <Link href="/profile">Edit profile</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[280px,1fr,300px] lg:px-8">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden border-border/70 bg-card/70">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-lg">{profileName}</CardTitle>
                <CardDescription>@{profile.username}</CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <p className="text-xl font-semibold">{postCount.toLocaleString("en-US")}</p>
                  <p className="text-[11px] text-muted-foreground">Posts</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <p className="text-xl font-semibold">{totalLikes.toLocaleString("en-US")}</p>
                  <p className="text-[11px] text-muted-foreground">Likes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Profile type</span>
                <span className="text-right text-foreground">
                  {isCurator ? curatorLabel : profile.kind === "native" ? "Native" : "External X"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Joined</span>
                <span className="text-right text-foreground">
                  {joinedAt ? joinedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Recently"}
                </span>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5">
                {isQubic
                  ? "Official Qubic channel — free to follow. New posts mirrored from X appear in Explore; after you follow, new posts queue in Audiopost automatically."
                  : isCurator
                    ? "Follow this channel to hear new headlines in Audiopost. Only posts published after you follow are queued automatically."
                    : "Posts on this profile can be listened to manually, and new eligible posts can flow into Audiopost queues."}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Posts</h2>
              <p className="text-xs text-muted-foreground">Public updates · moderated images · audio-ready text</p>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">
              {postCount} total
            </Badge>
          </div>

          {isOwnProfile ? <NewPostPanel /> : null}

          {(posts ?? []).length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">No posts yet</CardTitle>
                <CardDescription>
                  When this creator publishes, text and up to four images will appear in this feed.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {(posts ?? []).map((post) => {
            const createdAt = new Date(post.created_at);
            const autoQueued = subscribed && listeningSince ? createdAt >= listeningSince : false;
            const postComments = comments.filter((comment) => comment.post_id === post.id);
            const postUrl = `/u/${profile.username}/p/${post.id}`;
            return (
              <Card key={post.id} className="overflow-hidden border-border/80 bg-card/70">
                <CardHeader className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
                      {profile.avatar_path ? (
                        <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="44px" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-1">
                          <EchonXLogo imageClassName="h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base font-semibold">{profileName}</CardTitle>
                        <span className="text-xs text-muted-foreground">@{profile.username}</span>
                      </div>
                      <CardDescription>
                        {createdAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {autoQueued ? "Auto queue" : "Manual listen"}
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{post.body}</p>
                  <PostContextAnalysis
                    postId={post.id}
                    isAuthenticated={!!viewerId}
                    signInCallbackUrl={callbackUrl}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  {(post.image_paths as string[] | null)?.length ? (
                    <div className="space-y-3">
                      {(post.image_paths as string[]).map((src, index) => (
                        <PostFeedImage
                          key={src}
                          src={src}
                          sizes="(max-width: 1024px) 100vw, 640px"
                          externalSource={(post.external_source as string | null) ?? null}
                          authorKind={profile.kind}
                          dimensions={parseXImageDimensions(post.moderation_payload, index)}
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
                    <PostSocialActions
                      postId={post.id}
                      postUrl={postUrl}
                      post={{
                        authorName: profileName,
                        username: profile.username,
                        avatarPath: profile.avatar_path,
                        body: post.body,
                        createdAt: post.created_at,
                        imagePaths: (post.image_paths as string[] | null) ?? [],
                        likeCount: post.like_count ?? 0,
                        liked: liked.has(post.id),
                        externalSource: (post.external_source as string | null) ?? null,
                        authorKind: profile.kind,
                        moderationPayload: (post.moderation_payload as Record<string, unknown> | null) ?? null,
                      }}
                      comments={postComments}
                      likeCount={post.like_count ?? 0}
                      liked={liked.has(post.id)}
                      isAuthenticated={!!viewerId}
                      signInCallbackUrl={callbackUrl}
                    />
                    <ListenButton
                      text={post.body}
                      autoQueued={autoQueued}
                      listenAllowed={canListenAudiopost}
                      listenBlockedMessage={listenBlockedMessage}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </main>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/70 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Listening actions</CardTitle>
              <CardDescription>Follow this profile to hear future posts through Audiopost.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isOwnProfile ? (
                <WantToHearButton
                  profileId={profile.id}
                  initialSubscribed={subscribed}
                  isAuthenticated={!!viewerId}
                  signInCallbackUrl={callbackUrl}
                  labelFollow={t.explore.follow}
                  labelFollowing={t.explore.following}
                />
              ) : (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">Edit profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
