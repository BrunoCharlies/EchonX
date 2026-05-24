import {
  normalizeSpeechLocale,
  PORTUGUESE_SPEECH_LOCALE,
  type SpeechLocale,
} from "@/lib/voice/speech-locale";

export type { SpeechLocale };
export { PORTUGUESE_SPEECH_LOCALE };
/** US product default: mirrored X posts always open with English intro at import and in queue. */
export const MIRRORED_X_POST_INTRO_LOCALE: SpeechLocale = "en-US";

const LEADING_JUNK = /^[\u200B-\u200D\uFEFF\s]+/u;

/** Normalizes mirrored-post bodies before prefix parsing (X / DB quirks). */
export function normalizeAnnouncementBody(body: string): string {
  return body
    .replace(/^\uFEFF/, "")
    .replace(LEADING_JUNK, "")
    .replace(/\uFF1A/g, ":")
    .replace(/\uFE55/g, ":")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const LEGACY_POSTOU_INTRO =
  /^(.+?)\s+postou\s*[:：]\s*(.+)$/iu;

const STORED_PREFIX_PATTERNS: { re: RegExp; authorGroup: number; contentGroup: number }[] = [
  { re: /^(.+?)\s+postou\s*:\s*(.+)$/iu, authorGroup: 1, contentGroup: 2 },
  { re: /^(.+?)\s+posted\s*:\s*(.+)$/iu, authorGroup: 1, contentGroup: 2 },
  { re: /^Post by (.+?)\s*:\s*(.+)$/iu, authorGroup: 1, contentGroup: 2 },
  { re: /^Publicación de (.+?)\s*:\s*(.+)$/iu, authorGroup: 1, contentGroup: 2 },
  { re: /^Publication de (.+?)\s*:\s*(.+)$/iu, authorGroup: 1, contentGroup: 2 },
];

export function parseStoredPostAnnouncement(body: string): { author: string; content: string } | null {
  const trimmed = normalizeAnnouncementBody(body);
  if (!trimmed) return null;
  for (const { re, authorGroup, contentGroup } of STORED_PREFIX_PATTERNS) {
    const match = trimmed.match(re);
    if (match) {
      return {
        author: match[authorGroup]?.trim() ?? "",
        content: match[contentGroup]?.trim() ?? "",
      };
    }
  }
  return null;
}

function stripEmbeddedLegacyIntro(content: string): string {
  const trimmed = content.trim();
  const inner = parseStoredPostAnnouncement(trimmed);
  if (inner) return inner.content.trim();
  return trimmed.replace(/^(.+?)\s+postou\s*[:：]\s*/iu, "").trim();
}

/** Body stored on import/sync for mirrored X posts (listen + audiopost). */
export function buildMirroredXPostBody(author: string, postText: string): string {
  const label = author.trim() || "Unknown";
  return formatPostAnnouncement(label, postText, MIRRORED_X_POST_INTRO_LOCALE);
}

/** Queue/TTS/UI: always English "Post by …", including legacy DB lines with postou. */
export function normalizeMirroredPostBodyForListen(body: string): string {
  let text = normalizeAnnouncementBody(body);
  if (!text) return body;

  for (let pass = 0; pass < 4; pass++) {
    const parsed = parseStoredPostAnnouncement(text);
    if (parsed) {
      const content = stripEmbeddedLegacyIntro(parsed.content);
      const next = formatPostAnnouncement(parsed.author, content, MIRRORED_X_POST_INTRO_LOCALE);
      if (next === text) return next;
      text = next;
      continue;
    }

    const replaced = text.replace(/^(.+?)\s+postou\s*[:：]\s*/iu, (_, author: string) => {
      return `Post by ${author.trim()}: `;
    });
    if (replaced === text) return text;
    text = replaced;
  }

  return text;
}

/** Intro line before the X post text, localized for TTS. */
export function formatPostAnnouncement(author: string, content: string, locale: SpeechLocale): string {
  const label = author.trim() || "Unknown";
  const text = content.trim();
  switch (locale) {
    case "pt-BR":
      return text ? `${label} postou: ${text}` : `${label} postou.`;
    case "es-ES":
      return text ? `Publicación de ${label}: ${text}` : `Publicación de ${label}.`;
    case "fr-FR":
      return text ? `Publication de ${label} : ${text}` : `Publication de ${label}.`;
    case "en-US":
    default:
      return text ? `Post by ${label}: ${text}` : `Post by ${label}.`;
  }
}

export function speechLocaleFromLang(lang: string | undefined): SpeechLocale {
  return normalizeSpeechLocale(lang);
}

/** Heuristic locale from post text (ignores mirrored X intro like "postou"). */
export function detectSpeechLocaleFromText(text: string): SpeechLocale {
  const parsed = parseStoredPostAnnouncement(text);
  const sample = parsed?.content?.trim() || text.trim();
  if (!sample) return "en-US";

  const normalized = ` ${sample.toLowerCase()} `;
  const portugueseScore =
    (/[ãõáàâêéíóôúç]/i.test(sample) ? 3 : 0) +
    (normalized.match(/\b(que|não|para|com|uma|você|está|por|mais|como|foi|ser|ter|seu|sua|pra|tá|aí|né|vocês)\b/g)?.length ??
      0);
  const spanishScore =
    (/[ñ¿¡]/i.test(sample) ? 3 : 0) +
    (normalized.match(/\b(que|para|con|una|usted|está|por|más|como|fue|ser|tener|pero|los|las)\b/g)?.length ?? 0);
  const frenchScore =
    (/[àâçéèêëîïôûùüÿœ]/i.test(sample) ? 3 : 0) +
    (normalized.match(/\b(que|pour|avec|une|vous|être|est|pas|plus|comme|dans|les|des|nous)\b/g)?.length ?? 0);

  const scores = [
    { lang: "pt-BR" as const, score: portugueseScore },
    { lang: "es-ES" as const, score: spanishScore },
    { lang: "fr-FR" as const, score: frenchScore },
  ].sort((a, b) => b.score - a.score);

  const winner = scores[0];
  if (!winner || winner.score <= 1) return "en-US";
  return winner.lang === "pt-BR" ? PORTUGUESE_SPEECH_LOCALE : winner.lang;
}

export type PlaybackLanguageSetting = "original" | SpeechLocale;

export function resolvePlaybackSpeechLocale(
  language: PlaybackLanguageSetting,
  body: string,
): SpeechLocale {
  if (language === "en-US" || language === "pt-BR" || language === "es-ES" || language === "fr-FR") {
    return language === "pt-BR" ? PORTUGUESE_SPEECH_LOCALE : language;
  }
  return detectSpeechLocaleFromText(body);
}

/** True when body uses the legacy Portuguese mirrored-X intro. */
export function hasLegacyPostouIntro(body: string): boolean {
  const normalized = normalizeAnnouncementBody(body);
  if (LEGACY_POSTOU_INTRO.test(normalized)) return true;
  if (/^Post by\s+.+:\s*.+\bpostou\s*[:：]/iu.test(normalized)) return true;
  return parseStoredPostAnnouncement(normalized) !== null && /\bpostou\b/iu.test(normalized);
}

/** Rewrites legacy DB lines (e.g. Portuguese "postou") for the listener's language. */
export function localizePostBodyForSpeech(body: string, locale: SpeechLocale): string {
  if (locale === MIRRORED_X_POST_INTRO_LOCALE) {
    return normalizeMirroredPostBodyForListen(body);
  }
  const normalized = normalizeAnnouncementBody(body);
  const parsed = parseStoredPostAnnouncement(normalized);
  if (parsed) {
    return formatPostAnnouncement(parsed.author, parsed.content, locale);
  }
  const legacy = normalized.match(LEGACY_POSTOU_INTRO);
  if (legacy) {
    return formatPostAnnouncement(legacy[1] ?? "", legacy[2] ?? "", locale);
  }
  return body;
}
