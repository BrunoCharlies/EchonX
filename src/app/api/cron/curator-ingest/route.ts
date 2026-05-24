import { NextResponse } from "next/server";
import { runNewsCuratorIngest } from "@/lib/curator/ingest";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!secret || bearer !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runNewsCuratorIngest();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Ingest failed." },
      { status: 500 },
    );
  }
}
