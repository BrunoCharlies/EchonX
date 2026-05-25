import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_OG_IMAGE_SIZE, SITE_SOCIAL_TITLE } from "@/lib/seo/social-share";

export const alt = SITE_SOCIAL_TITLE;
export const size = SITE_OG_IMAGE_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function Image() {
  const logoPath = path.join(process.cwd(), "public", "brand", "echonx-logo.png");
  const logoBytes = await readFile(logoPath);
  const logoSrc = `data:image/png;base64,${logoBytes.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #020408 0%, #050a12 38%, #0c1929 72%, #1a1035 100%)",
          padding: "40px 72px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={520} height={300} alt="" style={{ objectFit: "contain" }} />
        <p
          style={{
            marginTop: 32,
            fontSize: 42,
            fontWeight: 600,
            color: "#f1f5f9",
            textAlign: "center",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Hear what matters. Ignore the noise.
        </p>
        <p
          style={{
            marginTop: 18,
            fontSize: 24,
            color: "#38bdf8",
            letterSpacing: "0.08em",
          }}
        >
          echonx.app
        </p>
      </div>
    ),
    { ...size },
  );
}
