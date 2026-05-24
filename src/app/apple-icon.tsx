import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "ui-sans-serif, system-ui",
          borderRadius: 40,
        }}
      >
        E
      </div>
    ),
    { ...size },
  );
}
