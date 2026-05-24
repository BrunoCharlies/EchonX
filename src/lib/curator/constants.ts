/** Registry slot for the curated news channel (RSS headlines). */
export const NEWS_OFFICIAL_CHANNEL_SLOT = "news";

/** Reserved for platform updates, launches, and product news (not RSS curator). */
export const ECHONX_PLATFORM_CHANNEL_SLOT = "echonx";

/** Public @username for the News channel profile. */
export const NEWS_OFFICIAL_USERNAME = "news";

/** posts.external_source value for automated News channel posts. */
export const NEWS_CURATOR_EXTERNAL_SOURCE = "news_curator";

/** Legacy value before rename; kept for Explore queries on existing rows. */
export const LEGACY_ECHONX_CURATOR_EXTERNAL_SOURCE = "echonx_curator";

/** Stable owner key for curator profiles (no auth.users row). */
export const NEWS_OFFICIAL_OWNER_KEY = "curator:news";

export const DEFAULT_NEWS_DISPLAY_NAME = "News";

export const DEFAULT_NEWS_BIO =
  "Curated headlines from terms-compliant sources. Source links stay in the post; audio skips URLs.";

/** Values used when deduplicating curator ingest. */
export const CURATOR_EXTERNAL_SOURCES = [
  NEWS_CURATOR_EXTERNAL_SOURCE,
  LEGACY_ECHONX_CURATOR_EXTERNAL_SOURCE,
] as const;

/** Planned official Qubic channel (X mirror). See docs/decisions/2026-05-qubic-official-x-channel.md */
export const QUBIC_OFFICIAL_CHANNEL_SLOT = "qubic";

/** Public @username on EchonX (not the X mirror prefix `x_`). */
export const QUBIC_OFFICIAL_USERNAME = "qubic";

/** X account to poll — user-provided display form @_Qubic_ */
export const QUBIC_X_HANDLE_DISPLAY = "@_Qubic_";

/** Normalized for X API v2 `users/by/username` (lowercase, no @). */
export const QUBIC_X_USERNAME = "_qubic_";

export const QUBIC_OFFICIAL_OWNER_KEY = "curator:qubic";

/** posts.external_source for mirrored tweets (not `external_x` profile kind). */
export const QUBIC_X_MIRROR_EXTERNAL_SOURCE = "qubic_x";

export const DEFAULT_QUBIC_DISPLAY_NAME = "Qubic";

export const DEFAULT_QUBIC_BIO =
  "Official Qubic updates mirrored from X. Free to follow and hear on EchonX.";
