import { NextResponse } from "next/server";
import { searchProfiles } from "@/lib/profiles/search-profiles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const nativeOnly = searchParams.get("native") !== "0";

  const results = await searchProfiles({
    query: q,
    nativeOnly,
    limit: 8,
  });

  return NextResponse.json({
    results: results.map((profile) => ({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_path: profile.avatar_path,
    })),
  });
}
