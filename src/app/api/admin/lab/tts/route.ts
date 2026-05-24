import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fishTtsStatusPayload, synthesizeFishTtsResponse, type FishTtsJsonBody } from "@/lib/voice/fish-tts-http";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ...fishTtsStatusPayload("admin-lab"),
    backend: "fish-s2-pro",
    note: "Production /app uses POST /api/listening/tts for paid subscribers only. Lab admin uses this route.",
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: FishTtsJsonBody;
  try {
    body = (await request.json()) as FishTtsJsonBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  return synthesizeFishTtsResponse(body);
}
