/** Shared copy for Open Graph / X (Twitter) link previews. */
export const SITE_SOCIAL_TITLE = "EchonX — Hear what matters. Ignore the noise.";
export const SITE_SOCIAL_DESCRIPTION =
  "Profile-first social listening. Turn the voices you follow into a personal podcast—native profiles, on-device audio, and a calmer way to stay informed.";

/**
 * Social card artwork at `public/brand/echonx-social-share.jpg` (1200×630 recommended).
 * Use JPEG or PNG with matching extension and real file format (not .png that is JPEG bytes).
 */
export const SITE_OG_IMAGE_PATH = "/brand/echonx-social-share.jpg";
export const SITE_OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function siteOgImageAbsoluteUrl(metadataBase: URL | string): string {
  const base = typeof metadataBase === "string" ? new URL(metadataBase) : metadataBase;
  return new URL(SITE_OG_IMAGE_PATH, base).href;
}
