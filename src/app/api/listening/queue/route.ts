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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const supabase = createServiceRoleClient();
    const query = supabase
      .from("listening_queue")
      .select("id, post_id")
      .eq("listener_x_user_id", session.user.id)
      .is("consumed_at", null)
      .order("id", { ascending: true })
      .limit(50);

    const { data: rows, error: qErr } = await query;

    if (qErr?.message.toLowerCase().includes("consumed_at")) {
      console.error(
        "[listening/queue] consumed_at column missing — apply supabase/migrations/00019_listening_queue_no_unconsume.sql",
      );
      return NextResponse.json({ items: [], migrationRequired: true });
    }

    if (qErr) {
      if (qErr.code !== "PGRST205") {
        console.error("[listening/queue] queue query failed", qErr);
      }
      return NextResponse.json({ items: [] });
    }

    const ids = (rows ?? [])
      .map((r) => r.post_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    if (!ids.length) {
      return NextResponse.json({ items: [] });
    }

    const { data: posts, error: pErr } = await supabase
      .from("posts")
      .select("id, body, created_at, author_id")
      .in("id", ids);
    if (pErr) {
      console.error("[listening/queue] posts query failed", pErr);
      return NextResponse.json({ items: [] });
    }

    const authorIds = [
      ...new Set(
        (posts ?? [])
          .map((p) => p.author_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    ];
    const { data: authors } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("id, username, kind, owner_x_user_id")
          .in("id", authorIds)
      : { data: [] };
    const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

    const entitlement = await loadUserEntitlement(supabase, session.user.id);
    const skipPlanFilter = session.user.role === "admin";

    const items = (rows ?? [])
      .map((row) => {
        const post = posts?.find((p) => p.id === row.post_id);
        if (!post?.id) return null;
        const author = authorMap.get(post.author_id);
        if (
          !skipPlanFilter &&
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
          )
        ) {
          return null;
        }
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

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[listening/queue] unexpected failure", error);
    return NextResponse.json({ items: [] });
  }
}
