import { NextResponse } from "next/server";
import {
  syncExternalXListeningProfiles,
  X_SYNC_ONLINE_WINDOW_MINUTES_DEFAULT,
} from "@/lib/x/sync-listening";

export const runtime = "nodejs";
export const maxDuration = 300;

function onlineWindowMinutes(): number {
  const raw = process.env.X_SYNC_ONLINE_WINDOW_MINUTES?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : X_SYNC_ONLINE_WINDOW_MINUTES_DEFAULT;
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!secret || bearer !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const windowMin = onlineWindowMinutes();
    const result = await syncExternalXListeningProfiles({
      source: "cron_online",
      intervalMs: windowMin * 60_000,
      listenerIdForLogs: null,
      onlineOnly: true,
      onlineWindowMinutes: windowMin,
    });

    return NextResponse.json({
      ok: true,
      onlineWindowMinutes: windowMin,
      ...result,
      message: `Synced ${result.profilesChecked} X profile(s) for online listeners; imported ${result.imported} post(s).`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "X listening sync failed.",
      },
      { status: 500 },
    );
  }
}
