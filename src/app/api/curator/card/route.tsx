import { ImageResponse } from "next/og";
import { pickCuratorCardAccent } from "@/lib/curator/card-accent";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("t") ?? "News headline").slice(0, 180);
  const source = (searchParams.get("s") ?? "EchonX News").slice(0, 56);
  const seed = searchParams.get("e") ?? title;
  const accent = pickCuratorCardAccent(seed);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 55%, #0f172a 100%)`,
          color: "#f8fafc",
          fontFamily: "system-ui, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            {source}
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>{title}</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            opacity: 0.85,
          }}
        >
          <span>EchonX News</span>
          <span>Curated headline</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
