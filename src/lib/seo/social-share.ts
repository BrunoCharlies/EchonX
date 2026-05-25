import fs from "node:fs";
import path from "node:path";

/** Shared copy for Open Graph / X (Twitter) link previews. */
export const SITE_SOCIAL_TITLE = "EchonX — Hear what matters. Ignore the noise.";
export const SITE_SOCIAL_DESCRIPTION =
  "Profile-first social listening. Turn the voices you follow into a personal podcast—native profiles, on-device audio, and a calmer way to stay informed.";

/**
 * Recommended artwork for link previews (X, LinkedIn, Facebook, WhatsApp, etc.).
 *
 * Place your file in `public/brand/` using one of these names (first match wins):
 * - `echonx-social-share.png` (preferred)
 * - `echonx-social-share.jpg`
 * - `echonx-social-share.webp`
 *
 * Specs:
 * - Size: 1200 × 630 px (aspect ratio 1.91:1)
 * - Format: PNG (best for text/logo) or JPEG (photos); WebP also works
 * - Max file size: under 5 MB (aim for under 1 MB for faster crawls)
 * - Safe zone: keep logo and headline ~40 px from edges (mobile crops slightly)
 * - No critical text in outer 10% (some networks trim corners)
 */
export const SITE_OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const STATIC_OG_FILENAMES = [
  "echonx-social-share.png",
  "echonx-social-share.jpg",
  "echonx-social-share.jpeg",
  "echonx-social-share.webp",
] as const;

/** Auto-generated card when no custom file is present (`src/app/opengraph-image.tsx`). */
export const SITE_OG_GENERATED_PATH = "/opengraph-image";

export function resolveSiteOgImagePath(): string {
  const brandDir = path.join(process.cwd(), "public", "brand");
  for (const file of STATIC_OG_FILENAMES) {
    if (fs.existsSync(path.join(brandDir, file))) {
      return `/brand/${file}`;
    }
  }
  return SITE_OG_GENERATED_PATH;
}
