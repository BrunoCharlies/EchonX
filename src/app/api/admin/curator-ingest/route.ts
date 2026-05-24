import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runNewsCuratorIngest } from "@/lib/curator/ingest";

export async function POST() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
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
