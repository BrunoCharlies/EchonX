import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runMentionReplyCycle } from "@/lib/agent/mentions";
import { isAgentCronAuthorized } from "@/lib/agent/scheduler";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Manual trigger: admin session or CRON_SECRET bearer. */
export async function POST(request: Request) {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  if (!isAdmin && !isAgentCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await runMentionReplyCycle();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "mentions_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
