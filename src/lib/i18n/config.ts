export const LOCALE_COOKIE = "echonx_locale";

export const LOCALES = ["en-US", "pt-BR", "es-ES", "fr-FR"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en-US";

export const LOCALE_OPTIONS: Array<{ value: Locale; label: string; shortLabel: string; flagPath: string }> = [
  { value: "en-US", label: "English", shortLabel: "EN", flagPath: "/flags/us.svg" },
  { value: "pt-BR", label: "Brasil", shortLabel: "BR", flagPath: "/flags/br.svg" },
  { value: "es-ES", label: "Español", shortLabel: "ES", flagPath: "/flags/es.svg" },
  { value: "fr-FR", label: "Français", shortLabel: "FR", flagPath: "/flags/fr.svg" },
];

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
