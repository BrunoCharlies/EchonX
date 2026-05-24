import { NextResponse } from "next/server";
import { syncAllXListeningQueuesForAdmin } from "@/server/actions/x-listening";

export const runtime = "nodejs";

export async function POST() {
  const result = await syncAllXListeningQueuesForAdmin({
    source: "admin_manual",
    intervalMs: 30 * 60_000,
  });

  const status = result.ok ? 200 : result.error === "Unauthorized." ? 401 : result.error === "Forbidden." ? 403 : 500;
  return NextResponse.json(result, { status });
}
