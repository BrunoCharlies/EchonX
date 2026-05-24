import type { SpeechLocale } from "@/lib/voice/speech-locale";

export const LIBRARY_BAR_SPEED_KEY = "echonx:library-bottom-bar-speed";
export const LIBRARY_BAR_LANGUAGE_KEY = "echonx:library-bottom-bar-language";

export const DEFAULT_LIBRARY_BAR_SPEED = 1;
export const LIBRARY_BAR_SPEED_MIN = 0.8;
export const LIBRARY_BAR_SPEED_MAX = 2;
export const LIBRARY_BAR_SPEED_STEP = 0.1;

/** "auto" = detect language from each segment text. */
export type LibraryReadingLanguage = "auto" | SpeechLocale;

export const LIBRARY_READING_LANGUAGES: Array<{
  value: LibraryReadingLanguage;
  label: string;
  shortLabel: string;
}> = [
  { value: "auto", label: "Auto (detect)", shortLabel: "Auto" },
  { value: "en-US", label: "English (US)", shortLabel: "EN" },
  { value: "pt-BR", label: "Português (BR)", shortLabel: "PT-BR" },
  { value: "es-ES", label: "Español", shortLabel: "ES" },
  { value: "fr-FR", label: "Français", shortLabel: "FR" },
];

export function clampLibraryBarSpeed(rate: number) {
  return Math.min(LIBRARY_BAR_SPEED_MAX, Math.max(LIBRARY_BAR_SPEED_MIN, rate));
}

export function isLibraryReadingLanguage(value: string): value is LibraryReadingLanguage {
  return LIBRARY_READING_LANGUAGES.some((language) => language.value === value);
}

export function readStoredLibraryBarSpeed() {
  if (typeof window === "undefined") return DEFAULT_LIBRARY_BAR_SPEED;
  const raw = window.localStorage.getItem(LIBRARY_BAR_SPEED_KEY);
  if (raw == null) return DEFAULT_LIBRARY_BAR_SPEED;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIBRARY_BAR_SPEED;
  return clampLibraryBarSpeed(parsed);
}

export function readStoredLibraryBarLanguage(): LibraryReadingLanguage {
  if (typeof window === "undefined") return "auto";
  const raw = window.localStorage.getItem(LIBRARY_BAR_LANGUAGE_KEY);
  if (!raw || !isLibraryReadingLanguage(raw)) return "auto";
  return raw;
}
