import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: rows, error: qErr } = await supabase
    .from("listening_queue")
    .select("id, post_id")
    .eq("listener_x_user_id", session.user.id)
    .is("consumed_at", null)
    .order("id", { ascending: true })
    .limit(50);

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => r.post_id).filter(Boolean);
  if (!ids.length) {
    return NextResponse.json({ items: [] });
  }

  const { data: posts, error: pErr } = await supabase.from("posts").select("id, body, created_at, author_id").in("id", ids);
  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id))];
  const { data: authors } = await supabase.from("profiles").select("id, username").in("id", authorIds);
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a.username]));

  const items = (rows ?? [])
    .map((row) => {
      const post = posts?.find((p) => p.id === row.post_id);
      if (!post) return null;
      return {
        queueId: Number(row.id),
        postId: post.id,
        body: post.body,
        createdAt: post.created_at,
        authorUsername: authorMap.get(post.author_id) ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ items });
}
