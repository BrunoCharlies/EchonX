/** BCP-47 tags used by the listen player (excluding "original"). Portuguese is always pt-BR (no pt-PT). */
export type SpeechLocale = "en-US" | "pt-BR" | "es-ES" | "fr-FR";

/** Product default for any Portuguese content or BCP-47 tag (never European pt-PT). */
export const PORTUGUESE_SPEECH_LOCALE: SpeechLocale = "pt-BR";

export function normalizeBcp47(tag?: string): string {
  return (tag ?? "").trim().toLowerCase().replace(/_/g, "-");
}

export function isEuropeanPortugueseLocale(tag: string): boolean {
  const normalized = normalizeBcp47(tag);
  return normalized === "pt-pt" || normalized.startsWith("pt-pt-");
}

export function isBrazilianPortugueseLocale(tag: string): boolean {
  const normalized = normalizeBcp47(tag);
  return normalized === "pt-br" || normalized.startsWith("pt-br-");
}

export function isPortugueseLocaleTag(tag: string): boolean {
  const normalized = normalizeBcp47(tag);
  return normalized === "pt" || normalized.startsWith("pt-");
}

function isEuropeanPortugueseVoiceName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    /\bportugal\b/.test(lower) ||
    /\bportuguese\s*\(\s*portugal\s*\)/.test(lower) ||
    /\bportugu[eê]s\s+de\s+portugal\b/.test(lower)
  );
}

/** True when a browser voice should not be used for Brazilian Portuguese TTS. */
export function isEuropeanPortugueseVoice(voice: { lang: string; name?: string }): boolean {
  if (isEuropeanPortugueseLocale(voice.lang)) return true;
  return isEuropeanPortugueseVoiceName(voice.name ?? "");
}

/**
 * Normalizes any incoming language tag to a supported speech locale.
 * All Portuguese variants (pt, pt-PT, etc.) map to pt-BR.
 */
export function normalizeSpeechLocale(tag?: string): SpeechLocale {
  const normalized = normalizeBcp47(tag);
  if (!normalized || normalized === "original") return "en-US";

  if (isPortugueseLocaleTag(normalized)) return PORTUGUESE_SPEECH_LOCALE;

  if (normalized === "en" || normalized.startsWith("en-")) return "en-US";
  if (normalized === "es" || normalized.startsWith("es-")) return "es-ES";
  if (normalized === "fr" || normalized.startsWith("fr-")) return "fr-FR";

  if (normalized === "pt-br") return "pt-BR";
  if (normalized === "es-es") return "es-ES";
  if (normalized === "fr-fr") return "fr-FR";
  if (normalized === "en-us") return "en-US";

  return "en-US";
}

/** Whether a browser voice can read aloud for the target speech locale. */
export function isCompatibleSpeechVoiceLang(voiceLang: string, locale: SpeechLocale | string): boolean {
  const target = normalizeSpeechLocale(locale);
  const voice = normalizeBcp47(voiceLang);

  if (target === "pt-BR") {
    if (isEuropeanPortugueseLocale(voice) || isEuropeanPortugueseVoiceName(voiceLang)) return false;
    return isBrazilianPortugueseLocale(voice) || voice === "pt";
  }

  const targetTag = normalizeBcp47(target);
  const language = targetTag.split("-")[0];
  return voice === targetTag || voice.startsWith(`${language}-`);
}
