export type EchonxTheme = "dark" | "lumos";

/** Legacy key (browser-wide); migrated into per-user keys on first read. */
export const ECHONX_THEME_STORAGE_KEY = "echonx-theme";

export function themeStorageKey(userId: string | null | undefined): string {
  if (userId) return `${ECHONX_THEME_STORAGE_KEY}:${userId}`;
  return ECHONX_THEME_STORAGE_KEY;
}

/** Public marketing site — Lumos only when an admin is signed in. */
export function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (
    pathname === "/about" ||
    pathname === "/pricing" ||
    pathname === "/explore" ||
    pathname === "/faq" ||
    pathname === "/terms" ||
    pathname === "/privacy"
  ) {
    return true;
  }
  if (pathname.startsWith("/u/")) return true;
  return false;
}

/** Audiopost dashboard only (`/app`) — not Explore, Settings, etc. */
export function isAudiopostPath(pathname: string): boolean {
  return pathname === "/app";
}

export function getStoredTheme(userId?: string | null): EchonxTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const key = themeStorageKey(userId);
    let value = window.localStorage.getItem(key);
    if (!value && userId) {
      value = window.localStorage.getItem(ECHONX_THEME_STORAGE_KEY);
      if (value === "lumos" || value === "dark") {
        window.localStorage.setItem(key, value);
      }
    }
    return value === "lumos" ? "lumos" : "dark";
  } catch {
    return "dark";
  }
}

export function resolveEffectiveTheme(
  stored: EchonxTheme,
  pathname: string,
  isAdmin: boolean,
): EchonxTheme {
  if (isAudiopostPath(pathname)) return "dark";
  if (isMarketingPath(pathname) && !isAdmin) return "dark";
  return stored;
}

function syncThemeCookie(theme: EchonxTheme, userId: string | null | undefined) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${ECHONX_THEME_STORAGE_KEY}=${theme};path=/;max-age=${maxAge};samesite=lax`;
  if (userId) {
    document.cookie = `echonx-theme-uid=${userId};path=/;max-age=${maxAge};samesite=lax`;
  } else {
    document.cookie = "echonx-theme-uid=;path=/;max-age=0;samesite=lax";
  }
}

export function applyThemeClasses(theme: EchonxTheme) {
  const root = document.documentElement;
  if (theme === "lumos") {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  } else {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
}

export function persistThemePreference(theme: EchonxTheme, userId?: string | null) {
  try {
    window.localStorage.setItem(themeStorageKey(userId), theme);
    syncThemeCookie(theme, userId);
  } catch {
    // Optional preference.
  }
}

/** Applies classes to the document; persists to storage when `persist` is true (default). */
export function applyEchonxTheme(
  theme: EchonxTheme,
  userId?: string | null,
  options?: { persist?: boolean },
) {
  applyThemeClasses(theme);
  if (options?.persist !== false) {
    persistThemePreference(theme, userId);
  }
}
