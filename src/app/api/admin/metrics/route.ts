import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date();
  const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  const [
    registeredRes,
    activeRes,
    onlineRes,
    postsRes,
    readsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", sevenDaysAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen_at", twoMinAgo),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("text_read_events").select("*", { count: "exact", head: true }).gte("read_at", startOfUtcDay),
  ]);

  const registeredUsers = registeredRes.count ?? 0;
  const activeUsers = activeRes.count ?? 0;
  const onlineUsers = onlineRes.count ?? 0;
  const offlineUsers = Math.max(0, registeredUsers - onlineUsers);
  const postsCreated = postsRes.count ?? 0;
  const textsReadToday = readsRes.count ?? 0;

  return NextResponse.json({
    generatedAt: now.toISOString(),
    registeredUsers,
    activeUsers,
    onlineUsers,
    offlineUsers,
    postsCreated,
    textsReadToday,
  });
}
