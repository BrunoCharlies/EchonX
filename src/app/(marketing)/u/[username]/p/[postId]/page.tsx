import Image from "next/image";
import Link from "next/link";
import { PostFeedImage } from "@/components/posts/post-feed-image";
import { parseXImageDimensions } from "@/lib/posts/post-image-display";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = { params: Promise<{ username: string; postId: string }> };

function previewText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 50 ? `${normalized.slice(0, 50)}...` : normalized;
}

async function getPost(username: string, postId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, body, image_paths, external_source, moderation_payload, created_at, profiles!inner(username, display_name, avatar_path, kind)",
    )
    .eq("id", postId)
    .eq("profiles.username", username.toLowerCase())
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, postId } = await params;
  const post = await getPost(username, postId);
  if (!post) return { title: "Post" };

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const title = `${profile?.display_name ?? `@${username}`} on EchonX`;
  const description = previewText(post.body ?? "");
  const image = Array.isArray(post.image_paths) && post.image_paths[0] ? post.image_paths[0] : undefined;
  const url = `/u/${username}/p/${postId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicPostPage({ params }: PageProps) {
  const { username, postId } = await params;
  const post = await getPost(username, postId);
  if (!post) notFound();

  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  const image = Array.isArray(post.image_paths) && post.image_paths[0] ? post.image_paths[0] : null;
  const createdAt = new Date(post.created_at);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-border/80 bg-card/70">
        <CardHeader className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-border/70 bg-secondary">
              {profile?.avatar_path ? (
                <Image src={profile.avatar_path} alt="" fill className="object-cover" sizes="48px" unoptimized />
              ) : null}
            </div>
            <div>
              <CardTitle className="text-lg">{profile?.display_name ?? `@${username}`}</CardTitle>
              <CardDescription>
                @{username} · {createdAt.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </CardDescription>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{post.body}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {image ? (
            <PostFeedImage
              src={image}
              sizes="(max-width: 768px) 100vw, 672px"
              externalSource={(post.external_source as string | null) ?? null}
              authorKind={(profile?.kind as string | null) ?? null}
              dimensions={parseXImageDimensions(post.moderation_payload, 0)}
            />
          ) : null}
          <Button asChild className="w-full">
            <Link href={`/u/${username}#post-${postId}`}>Open profile post</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
