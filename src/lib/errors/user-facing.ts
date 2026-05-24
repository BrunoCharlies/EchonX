import { formatSupabaseError } from "@/lib/billing/supabase-error";

/** Shown to end users when no specific copy applies. Never include vendor or config details. */
export const USER_FACING_DEFAULT_MESSAGE =
  "Something went wrong on our side. Please try again in a moment.";

/**
 * Public error codes for support and logs correlation.
 * Internal reasons stay in server logs only.
 */
export const USER_FACING_ERROR_CODES = {
  EGEN001: "EGEN001",
  EAUTH001: "EAUTH001",
  EREQ001: "EREQ001",
  EAI001: "EAI001",
  EAI002: "EAI002",
  EAI003: "EAI003",
} as const;

export type UserFacingErrorCode =
  (typeof USER_FACING_ERROR_CODES)[keyof typeof USER_FACING_ERROR_CODES];

const USER_FACING_MESSAGES: Record<UserFacingErrorCode, string> = {
  EGEN001: USER_FACING_DEFAULT_MESSAGE,
  EAUTH001: "Please sign in to continue.",
  EREQ001: "We could not process that request. Refresh the page and try again.",
  EAI001: USER_FACING_DEFAULT_MESSAGE,
  EAI002: "You've reached today's limit for AI Context. See plans for more analyses.",
  EAI003: USER_FACING_DEFAULT_MESSAGE,
};

export type UserFacingErrorPayload = {
  error: string;
  code: UserFacingErrorCode;
  redirectUrl?: string;
};

export function userFacingMessage(code: UserFacingErrorCode): string {
  return USER_FACING_MESSAGES[code] ?? USER_FACING_DEFAULT_MESSAGE;
}

/** Standard API JSON body for clients. */
export function userFacingErrorResponse(
  code: UserFacingErrorCode,
  options?: { redirectUrl?: string },
): UserFacingErrorPayload {
  return {
    error: userFacingMessage(code),
    code,
    ...(options?.redirectUrl ? { redirectUrl: options.redirectUrl } : {}),
  };
}

export type UserFacingApiErrorBody = {
  error?: string;
  code?: string;
  redirectUrl?: string;
};

/** Client: trust `code` only; never show raw server `error` if unknown. */
export function resolveUserFacingClientError(body: UserFacingApiErrorBody | null | undefined): {
  message: string;
  code: UserFacingErrorCode;
  redirectUrl?: string;
} {
  const code =
    body?.code && body.code in USER_FACING_MESSAGES
      ? (body.code as UserFacingErrorCode)
      : USER_FACING_ERROR_CODES.EGEN001;

  return {
    message: userFacingMessage(code),
    code,
    redirectUrl: body?.redirectUrl,
  };
}

export function formatUserFacingDisplay(code: UserFacingErrorCode, message?: string) {
  const text = message ?? userFacingMessage(code);
  return `${text} (${code})`;
}

/** Maps AI verify-post internal codes to public codes. */
export function mapAiVerifyErrorCode(internal: string): UserFacingErrorCode {
  switch (internal) {
    case "daily_limit":
      return USER_FACING_ERROR_CODES.EAI002;
    case "not_found":
      return USER_FACING_ERROR_CODES.EAI003;
    case "openai_unconfigured":
    case "openai_failed":
      return USER_FACING_ERROR_CODES.EAI001;
    default:
      return USER_FACING_ERROR_CODES.EGEN001;
  }
}

/** @deprecated Prefer resolveUserFacingClientError — kept for non-API paths that still sanitize strings. */
export function formatUserFacingError(error: unknown, fallback: string): string {
  const raw = formatSupabaseError(error, fallback);
  return raw
    .replace(/supabase/gi, "EchonX")
    .replace(/postgrest/gi, "database")
    .replace(/postgres/gi, "database")
    .replace(/sightengine/gi, "safety review")
    .replace(/edge function/gi, "automated review")
    .replace(/schema cache/gi, "database")
    .replace(/openai/gi, "AI service")
    .replace(/stripe/gi, "billing")
    .replace(/vercel/gi, "hosting")
    .replace(/\.env\.local/gi, "")
    .replace(/api key/gi, "credentials")
    .replace(/not configured/gi, "unavailable")
    .replace(/\.sql/gi, "")
    .replace(/migration\s+\S+/gi, "setup")
    .trim();
}
