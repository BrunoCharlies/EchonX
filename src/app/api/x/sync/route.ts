import { NextResponse } from "next/server";
import { syncMyXListeningQueue } from "@/server/actions/x-listening";

export const runtime = "nodejs";

const allowedSources = new Set(["background", "active_audiopost", "manual"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { mode?: unknown; intervalMs?: unknown } | null;
  const mode = typeof body?.mode === "string" && allowedSources.has(body.mode) ? body.mode : "manual";
  const intervalMs = typeof body?.intervalMs === "number" && Number.isFinite(body.intervalMs) ? body.intervalMs : undefined;
  const result = await syncMyXListeningQueue({ source: mode as "background" | "active_audiopost" | "manual", intervalMs });
  return NextResponse.json(result);
}
