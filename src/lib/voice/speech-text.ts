import { normalizeMirroredPostBodyForListen } from "@/lib/voice/post-announcement";

/** Maximum characters read aloud per post in Audiopost (after URL/email stripping). */
export const MAX_AUDIOPOST_SPEECH_CHARS = 220;

/** Removes URLs, domains, and emails so they are not spoken. */
export function stripTextForSpeech(text: string) {
  return text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ")
    .replace(/\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|ai|app|dev|co|us|uk|br|fr|es|de|gov|edu|ly|me|info|biz)(?:\/\S*)?\b/gi, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

/** Truncates at a sentence or word boundary when text exceeds the speech limit. */
export function truncateForSpeech(text: string, max = MAX_AUDIOPOST_SPEECH_CHARS) {
  if (text.length <= max) return text;

  const slice = text.slice(0, max);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("."),
  );

  if (sentenceEnd >= Math.floor(max * 0.45)) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace >= Math.floor(max * 0.55)) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }

  return `${slice.trim()}…`;
}

/** Final text sent to the voice engine (strip + truncate only; intro normalization is separate). */
export function prepareTextForSpeech(text: string) {
  return truncateForSpeech(stripTextForSpeech(text));
}

/** Library PDF / Gutenberg segments — no 220-char cap; light normalize only. */
export function prepareLibrarySegmentForSpeech(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/** Mirrored X queue line: English intro + strip + truncate for TTS. */
export function prepareMirroredPostForSpeech(body: string) {
  return prepareTextForSpeech(normalizeMirroredPostBodyForListen(body));
}
