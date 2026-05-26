import { NextResponse } from "next/server";
import { runAutonomousPostCycle } from "@/lib/agent/posting";
import { isAgentCronAuthorized } from "@/lib/agent/scheduler";

export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(request: Request) {
  if (!isAgentCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runAutonomousPostCycle();
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "cron_post_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
