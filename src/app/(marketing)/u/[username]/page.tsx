import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { auth } from "@/auth";

import { loadPublicPostsByAuthorId, loadPublicProfileByUsername } from "@/lib/profiles/load-public-profile";

import { loadNativeProfileIntelligence } from "@/lib/profiles/load-native-profile-intelligence";

import { createServiceRoleClient } from "@/lib/supabase/service";

import { createClient } from "@/lib/supabase/server";

import { getServerDictionary } from "@/lib/i18n/server";

import {

  audiopostListenBlockedMessage,

  canListenToAudiopostAuthorWithPlan,

  loadUserEntitlement,

} from "@/lib/billing/entitlements";

import { isQubicOfficialProfile, officialChannelBadgeLabel } from "@/lib/curator/official-profiles";

import { isCuratorProfile } from "@/components/profile/official-channel-badge";

import { LegacyPublicProfileLayout } from "@/components/profile/legacy-public-profile-layout";

import { NativeProfileExperience } from "@/components/profile/native-intelligence/native-profile-experience";

import type { PostCommentItem } from "@/components/profile/post-comments";
import { isAuthLinkedNativeProfile, shouldDisplayAsNativeProfile } from "@/lib/profiles/profile-kind";
import { repairAuthLinkedProfileKind } from "@/lib/profiles/repair-profile-kind";



type PageProps = { params: Promise<{ username: string }> };



export const dynamic = "force-dynamic";



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {

  const { username } = await params;

  const handle = username.toLowerCase();

  const data = await loadPublicProfileByUsername(handle);

  if (!data) return { title: "Profile" };

  return {

    title: `${data.display_name ?? `@${data.username}`} on EchonX`,

    description: data.bio ?? "Public EchonX profile",

  };

}



export default async function PublicProfilePage({ params }: PageProps) {

  const { username } = await params;

  const handle = username.toLowerCase();

  const profile = await loadPublicProfileByUsername(handle);

  if (!profile) {

    notFound();

  }



  const posts = await loadPublicPostsByAuthorId(profile.id);

  const supabase = await createClient();

  const serviceSupabase = createServiceRoleClient();

  const t = await getServerDictionary();



  const session = await auth();

  const viewerId = session?.user?.id;



  const postIds = posts?.map((p) => p.id) ?? [];

  let comments: PostCommentItem[] = [];

  if (postIds.length) {

    const { data: commentRows, error: commentsErr } = await supabase

      .from("post_comments")

      .select("id, post_id, parent_comment_id, body, like_count, created_at, profiles:author_profile_id(username, display_name, avatar_path)")

      .in("post_id", postIds)

      .order("created_at", { ascending: true });

    if (!commentsErr) {

      comments = (commentRows ?? []).map((comment) => ({

        id: comment.id,

        post_id: comment.post_id,

        parent_comment_id: comment.parent_comment_id,

        body: comment.body,

        like_count: comment.like_count,

        created_at: comment.created_at,

        profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,

      }));

    }

  }



  const commentIds = comments.map((comment) => comment.id);

  const likedComments = new Set<string>();

  if (viewerId && commentIds.length) {

    const { data: commentLikes } = await supabase

      .from("post_comment_likes")

      .select("comment_id")

      .in("comment_id", commentIds)

      .eq("liker_x_user_id", viewerId);

    commentLikes?.forEach((like) => likedComments.add(like.comment_id));

    comments = comments.map((comment) => ({ ...comment, viewer_liked: likedComments.has(comment.id) }));

  }



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

    const { data: row } = await serviceSupabase

      .from("want_to_hear")

      .select("listening_since")

      .eq("listener_x_user_id", viewerId)

      .eq("target_profile_id", profile.id)

      .maybeSingle();

    subscribed = !!row;

    listeningSinceIso = row?.listening_since ?? null;

  }



  const listeningSince = listeningSinceIso ? new Date(listeningSinceIso) : null;



  let canListenAudiopost = true;

  let listenBlockedMessage: string | undefined;

  if (viewerId) {

    const entitlement = await loadUserEntitlement(serviceSupabase, viewerId);

    canListenAudiopost = canListenToAudiopostAuthorWithPlan(

      {

        kind: profile.kind,

        owner_x_user_id: profile.owner_x_user_id,

        username: profile.username,

      },

      entitlement.effectivePlan,

    );

    if (!canListenAudiopost) {

      listenBlockedMessage = audiopostListenBlockedMessage(entitlement.effectivePlan);

    }

  }



  const isCurator = isCuratorProfile(profile.kind);

  const isQubic = isQubicOfficialProfile({

    owner_x_user_id: profile.owner_x_user_id,

    username: profile.username,

  });

  const curatorLabel = officialChannelBadgeLabel({

    owner_x_user_id: profile.owner_x_user_id,

    username: profile.username,

  });

  const isOwnProfile =

    !!viewerId && !isCurator && (viewerId === profile.id || viewerId === profile.owner_x_user_id);

  const callbackUrl = `/u/${profile.username}`;

  const profileName = profile.display_name ?? `@${profile.username}`;

  const postCount = posts?.length ?? 0;

  const totalLikes = (posts ?? []).reduce((sum, post) => sum + (post.like_count ?? 0), 0);

  const joinedAt = profile.created_at ? new Date(profile.created_at) : null;

  const coverPath = typeof profile.cover_path === "string" ? profile.cover_path : null;

  let profileKind = (profile.kind as string | null) ?? "native";
  if (viewerId && isAuthLinkedNativeProfile(profile, viewerId) && profileKind === "external_x") {
    const repaired = await repairAuthLinkedProfileKind(serviceSupabase, profile, viewerId);
    if (repaired.repaired) profileKind = repaired.kind;
  }

  const profileForView = { ...profile, kind: profileKind };
  const useNativeExperience = shouldDisplayAsNativeProfile(profileForView, viewerId);

  if (useNativeExperience) {
    const intelligence = await loadNativeProfileIntelligence({
      profileId: profileForView.id,
      ownerXUserId: profileForView.owner_x_user_id,
      displayName: profileName,
      bio: profileForView.bio,
      role: (profileForView.role as string | null) ?? null,
      createdAt: profileForView.created_at,
      lastSeenAt: (profileForView.last_seen_at as string | null) ?? null,
      postCount,
      isOwnProfile,
    });

    return (
      <NativeProfileExperience
        profile={profileForView}

        posts={posts}

        comments={comments}

        liked={liked}

        intelligence={intelligence}

        subscribed={subscribed}

        listeningSince={listeningSince}

        canListenAudiopost={canListenAudiopost}

        listenBlockedMessage={listenBlockedMessage}

        viewerId={viewerId}

        isOwnProfile={isOwnProfile}

        callbackUrl={callbackUrl}

        profileName={profileName}

        postCount={postCount}

        coverPath={coverPath}

        t={t}

      />

    );

  }



  return (

    <LegacyPublicProfileLayout

      profile={profileForView}

      posts={posts}

      comments={comments}

      liked={liked}

      subscribed={subscribed}

      listeningSince={listeningSince}

      canListenAudiopost={canListenAudiopost}

      listenBlockedMessage={listenBlockedMessage}

      viewerId={viewerId}

      isOwnProfile={isOwnProfile}

      isCurator={isCurator}

      isQubic={isQubic}

      curatorLabel={curatorLabel}

      callbackUrl={callbackUrl}

      profileName={profileName}

      postCount={postCount}

      totalLikes={totalLikes}

      joinedAt={joinedAt}

      coverPath={coverPath}

      t={t}

    />

  );

}

