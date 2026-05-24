import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #22d3ee, #a855f7)",
          color: "white",
          fontSize: 220,
          fontWeight: 700,
          fontFamily: "ui-sans-serif, system-ui",
        }}
      >
        E
      </div>
    ),
    { width: 512, height: 512 },
  );
}
