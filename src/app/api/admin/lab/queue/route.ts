import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  canListenToAudiopostAuthorWithPlan,
  isBillableExternalXProfile,
  loadUserEntitlement,
} from "@/lib/billing/entitlements";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { normalizeMirroredPostBodyForListen } from "@/lib/voice/post-announcement";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const listenerId = session.user.id;
  const supabase = createServiceRoleClient();

  const { count: followCount } = await supabase
    .from("want_to_hear")
    .select("listener_x_user_id", { count: "exact", head: true })
    .eq("listener_x_user_id", listenerId);

  const pendingQuery = supabase
    .from("listening_queue")
    .select("id, post_id")
    .eq("listener_x_user_id", listenerId)
    .is("consumed_at", null)
    .order("id", { ascending: true })
    .limit(50);

  let { data: pendingRows, error: pendingErr } = await pendingQuery;

  if (pendingErr?.message.toLowerCase().includes("consumed_at")) {
    const retry = await supabase
      .from("listening_queue")
      .select("id, post_id")
      .eq("listener_x_user_id", listenerId)
      .order("id", { ascending: true })
      .limit(50);
    pendingRows = retry.data;
    pendingErr = retry.error;
  }

  if (pendingErr && pendingErr.code !== "PGRST205") {
    console.error("[admin/lab/queue] pending query failed", pendingErr);
    return NextResponse.json({ error: "queue_query_failed" }, { status: 500 });
  }

  const { count: consumedCount } = await supabase
    .from("listening_queue")
    .select("id", { count: "exact", head: true })
    .eq("listener_x_user_id", listenerId)
    .not("consumed_at", "is", null);

  const ids = (pendingRows ?? [])
    .map((r) => r.post_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (!ids.length) {
    return NextResponse.json({
      items: [],
      meta: {
        followCount: followCount ?? 0,
        pendingRows: 0,
        consumedRows: consumedCount ?? 0,
        filteredByPlan: 0,
        hint:
          (followCount ?? 0) === 0
            ? "no_follows"
            : (consumedCount ?? 0) > 0
              ? "all_consumed_or_no_new_posts"
              : "sync_x_profiles",
      },
    });
  }

  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("id, body, created_at, author_id")
    .in("id", ids);
  if (pErr) {
    console.error("[admin/lab/queue] posts query failed", pErr);
    return NextResponse.json({ error: "posts_query_failed" }, { status: 500 });
  }

  const authorIds = [
    ...new Set(
      (posts ?? [])
        .map((p) => p.author_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, username, kind, owner_x_user_id").in("id", authorIds)
    : { data: [] };
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const entitlement = await loadUserEntitlement(supabase, listenerId);
  let filteredByPlan = 0;

  const items = (pendingRows ?? [])
    .map((row) => {
      const post = posts?.find((p) => p.id === row.post_id);
      if (!post?.id) return null;
      const author = authorMap.get(post.author_id);
      const blockedByPlan =
        author &&
        isBillableExternalXProfile({
          kind: author.kind as string | null,
          owner_x_user_id: author.owner_x_user_id as string | null,
          username: author.username as string | null,
        }) &&
        !canListenToAudiopostAuthorWithPlan(
          {
            kind: author.kind as string | null,
            owner_x_user_id: author.owner_x_user_id as string | null,
            username: author.username as string | null,
          },
          entitlement.effectivePlan,
        );
      if (blockedByPlan) filteredByPlan += 1;
      return {
        queueId: Number(row.id),
        postId: post.id,
        body: normalizeMirroredPostBodyForListen(post.body ?? ""),
        createdAt: post.created_at ?? "",
        authorProfileId: post.author_id ?? null,
        authorUsername: (author?.username as string | null) ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({
    items,
    meta: {
      followCount: followCount ?? 0,
      pendingRows: pendingRows?.length ?? 0,
      consumedRows: consumedCount ?? 0,
      filteredByPlan,
      hint:
        items.length > 0
          ? filteredByPlan > 0
            ? "ok_admin_sandbox"
            : "ok"
          : filteredByPlan > 0
            ? "blocked_by_plan"
            : (consumedCount ?? 0) > 0
              ? "all_consumed_or_no_new_posts"
              : "sync_x_profiles",
      planFilterBypassed: true,
    },
  });
}
