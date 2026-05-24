import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backfillQubicXPostImages, stripQubicOgCardsFromImportedPosts } from "@/lib/curator/qubic-ingest";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const stripOnly = new URL(request.url).searchParams.get("stripCards") === "1";
    if (stripOnly) {
      const stripResult = await stripQubicOgCardsFromImportedPosts();
      if (!stripResult.ok) {
        return NextResponse.json({ ok: false, error: stripResult.error }, { status: 502 });
      }
      return NextResponse.json({
        ok: true,
        updated: 0,
        cardsRemoved: stripResult.cardsRemoved,
        message:
          stripResult.cardsRemoved > 0
            ? `Removed OG cards from ${stripResult.cardsRemoved} post${stripResult.cardsRemoved === 1 ? "" : "s"} with X photos.`
            : "No Qubic posts had both X photos and OG cards.",
      });
    }

    const result = await backfillQubicXPostImages();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Backfill failed." },
      { status: 500 },
    );
  }
}
