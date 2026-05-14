import { NextResponse } from "next/server";
import { moderateImageBuffer } from "@/lib/moderation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "file exceeds 2 MB after client compression" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await moderateImageBuffer(buffer, file.type || "application/octet-stream");

  if (!result.ok) {
    return NextResponse.json({ ok: false, result }, { status: 422 });
  }

  return NextResponse.json({ ok: true, result });
}
