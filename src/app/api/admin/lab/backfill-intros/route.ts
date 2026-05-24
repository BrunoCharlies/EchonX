import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  hasLegacyPostouIntro,
  normalizeMirroredPostBodyForListen,
} from "@/lib/voice/post-announcement";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * Rewrites legacy "postou" intros to "Post by …" for mirrored X posts (DB backfill).
 * Does not call the X API — fixes posts already in Supabase / listening queue.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const listenerId = session.user.id;

  const { data: queueRows, error: queueErr } = await supabase
    .from("listening_queue")
    .select("post_id")
    .eq("listener_x_user_id", listenerId)
    .is("consumed_at", null);

  if (queueErr && queueErr.code !== "PGRST205") {
    console.error("[admin/lab/backfill-intros] queue", queueErr);
    return NextResponse.json({ error: "queue_query_failed" }, { status: 500 });
  }

  const queuedPostIds = [
    ...new Set(
      (queueRows ?? [])
        .map((r) => r.post_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  if (!queuedPostIds.length) {
    return NextResponse.json({
      ok: true,
      scanned: 0,
      updated: 0,
      skipped: 0,
      samples: [],
      message: "Nenhum post pendente na fila.",
    });
  }

  const { data: posts, error: postsErr } = await supabase.from("posts").select("id, body").in("id", queuedPostIds);

  if (postsErr) {
    console.error("[admin/lab/backfill-intros] posts", postsErr);
    return NextResponse.json({ error: "posts_query_failed" }, { status: 500 });
  }

  const candidatePosts = (posts ?? []) as { id: string; body: string | null }[];

  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const samples: Array<{ id: string; before: string; after: string; hadLegacy: boolean }> = [];

  for (const post of candidatePosts) {
    scanned += 1;
    const body = String(post.body ?? "");
    if (!body) {
      skipped += 1;
      continue;
    }
    const nextBody = normalizeMirroredPostBodyForListen(body);
    const hadLegacy = hasLegacyPostouIntro(body);
    if (samples.length < 3) {
      samples.push({
        id: post.id,
        before: body.slice(0, 100),
        after: nextBody.slice(0, 100),
        hadLegacy,
      });
    }
    if (nextBody === body) {
      skipped += 1;
      continue;
    }
    const { error: updateErr } = await supabase.from("posts").update({ body: nextBody }).eq("id", post.id);
    if (updateErr) {
      console.error("[admin/lab/backfill-intros] update", post.id, updateErr);
      continue;
    }
    updated += 1;
  }

  return NextResponse.json({
    ok: true,
    scanned,
    updated,
    skipped,
    samples,
    message:
      updated > 0
        ? `Atualizados ${updated} de ${scanned} post(s) na fila: postou → Post by.`
        : `Nenhuma alteração (${scanned} na fila). Veja "samples" — se before=after, o formato não bateu.`,
  });
}
