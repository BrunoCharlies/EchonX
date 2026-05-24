import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runQubicOfficialXIngest } from "@/lib/curator/qubic-ingest";

export async function POST() {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const result = await runQubicOfficialXIngest();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Ingest failed." },
      { status: 500 },
    );
  }
}
