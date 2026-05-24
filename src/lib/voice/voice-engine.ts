import { prepareLibrarySegmentForSpeech, prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";
import { isAppleMobileBrowser } from "@/lib/voice/ios-speech-unlock";
import {
  isCompatibleSpeechVoiceLang,
  isEuropeanPortugueseVoice,
  normalizeSpeechLocale,
  type SpeechLocale,
} from "@/lib/voice/speech-locale";
/**
 * On-device voice wrapper.
 * Ships with Web Speech API playback so the queue player works before custom voice assets are wired.
 */
export type SpeakOptions = {
  voiceURI?: string;
  /** BCP-47 language tag used to pick a compatible browser voice, e.g. "pt-BR". */
  lang?: string;
  /** Web Speech API rate: 0.1–10, where 1 is default. We clamp to 0.8–2.0 for UX. */
  rate?: number;
  /** Output level 0–1 (Web Speech utterance.volume). */
  volume?: number;
  /** Gutenberg / library reader — skip Audiopost 220-char cap and X intro parsing. */
  libraryReading?: boolean;
  onEnd?: () => void;
};

export type VoiceEngine = {
  warmUp: () => Promise<void>;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  /** Live output level 0–1 (Fish: current audio; Web Speech: current + next chunks). */
  setVolume: (volume: number) => void;
};

function clampVolume(volume?: number) {
  const v = volume ?? 1;
  return Math.min(1, Math.max(0, v));
}

function clampRate(rate?: number, lang?: string) {
  const r = rate ?? 1;
  const maxRate = lang && lang !== "en-US" ? 1.05 : 2;
  return Math.min(maxRate, Math.max(0.8, r));
}

function splitForSpeech(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.map((s) => s.trim()).filter(Boolean)) {
    if ((current + " " + sentence).trim().length <= 180) {
      current = (current + " " + sentence).trim();
      continue;
    }
    if (current) chunks.push(current);
    if (sentence.length <= 180) {
      current = sentence;
    } else {
      for (let i = 0; i < sentence.length; i += 180) {
        chunks.push(sentence.slice(i, i + 180));
      }
      current = "";
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function getVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

async function loadVoices() {
  const voices = getVoices();
  if (voices.length) return voices;

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const handleVoicesChanged = () => {
      window.clearTimeout(timeout);
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(getVoices());
    };

    const timeout = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      resolve(getVoices());
    }, 600);

    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
  });
}

function voiceQualityScore(voice: SpeechSynthesisVoice, locale: SpeechLocale) {
  const name = voice.name.toLowerCase();
  const voiceLang = voice.lang.toLowerCase();
  const normalizedLang = locale.toLowerCase();
  let score = 0;

  if (isEuropeanPortugueseVoice(voice)) score -= 200;
  if (voiceLang === normalizedLang) score += 80;
  if (locale === "pt-BR" && (voiceLang === "pt-br" || voiceLang.startsWith("pt-br-"))) score += 40;
  if (name.includes("natural")) score += 60;
  if (name.includes("neural")) score += 55;
  if (name.includes("online")) score += 35;
  if (name.includes("microsoft")) score += 30;
  if (name.includes("premium")) score += 20;
  if (name.includes("google")) score -= 10;
  if (voice.default) score += 5;
  if (!voice.localService) score += 4;

  return score;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang?: string, voiceURI?: string) {
  if (!lang) return null;
  const locale = normalizeSpeechLocale(lang);
  const compatible = voices.filter((voice) => isCompatibleSpeechVoiceLang(voice.lang, locale));

  const selected = voiceURI ? compatible.find((voice) => voice.voiceURI === voiceURI) : null;
  if (selected) return selected;

  return compatible.sort((a, b) => voiceQualityScore(b, locale) - voiceQualityScore(a, locale))[0] ?? null;
}

let pendingCancelTimers: number[] = [];

function clearPendingCancels() {
  if (typeof window === "undefined") return;
  pendingCancelTimers.forEach((timer) => window.clearTimeout(timer));
  pendingCancelTimers = [];
}

function cancelSpeechSynthesis(mode: "immediate" | "robust" = "immediate") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  clearPendingCancels();
  window.speechSynthesis.cancel();
  if (mode !== "robust") return;
  pendingCancelTimers = [window.setTimeout(() => window.speechSynthesis.cancel(), 0)];
}

export async function createVoiceEngine(): Promise<VoiceEngine> {
  let generation = 0;
  let outputVolume = 1;
  let resolveCurrentSpeech: (() => void) | null = null;

  function finishCurrentSpeech() {
    resolveCurrentSpeech?.();
    resolveCurrentSpeech = null;
  }

  return {
    async warmUp() {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.resume();
      await loadVoices();
    },
    async speak(text: string, options?: SpeakOptions) {
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis is not available in this environment.");
        options?.onEnd?.();
        return;
      }
      const runGeneration = ++generation;
      clearPendingCancels();
      finishCurrentSpeech();
      cancelSpeechSynthesis();
      window.speechSynthesis.resume();
      const lang = normalizeSpeechLocale(options?.lang ?? "en-US");
      const voices = await loadVoices();
      const selectedVoice = pickVoice(voices, lang, options?.voiceURI);

      const speechText = options?.libraryReading
        ? prepareLibrarySegmentForSpeech(text)
        : prepareMirroredPostForSpeech(text);
      if (!speechText) {
        options?.onEnd?.();
        return;
      }

      for (const chunk of splitForSpeech(speechText)) {
        if (generation !== runGeneration) return;
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = lang;
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = clampRate(options?.rate, lang);
        utterance.volume = clampVolume(options?.volume ?? outputVolume);
        await new Promise<void>((resolve, reject) => {
          let settled = false;
          let abortInterval: ReturnType<typeof setInterval> | null = null;

          const cleanup = () => {
            if (abortInterval !== null) {
              clearInterval(abortInterval);
              abortInterval = null;
            }
          };

          const finish = () => {
            if (settled) return;
            settled = true;
            cleanup();
            if (resolveCurrentSpeech === finish) {
              resolveCurrentSpeech = null;
            }
            resolve();
          };

          const fail = (event: SpeechSynthesisErrorEvent) => {
            if (settled) return;
            settled = true;
            cleanup();
            if (resolveCurrentSpeech === finish) {
              resolveCurrentSpeech = null;
            }
            if (generation !== runGeneration || event.error === "interrupted" || event.error === "canceled") {
              resolve();
              return;
            }
            reject(new Error(`Speech synthesis stopped before the segment finished: ${event.error}`));
          };

          resolveCurrentSpeech = finish;
          utterance.onend = finish;
          utterance.onerror = fail;
          if (isAppleMobileBrowser()) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);

          abortInterval = setInterval(() => {
            if (generation !== runGeneration) {
              cancelSpeechSynthesis("immediate");
              finish();
            }
          }, 40);
        });
      }

      if (generation === runGeneration) {
        options?.onEnd?.();
      }
    },
    async pause() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
    },
    async resume() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
    },
    async stop() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        generation++;
        cancelSpeechSynthesis("robust");
        finishCurrentSpeech();
      }
    },
    setVolume(volume: number) {
      outputVolume = clampVolume(volume);
    },
  };
}
