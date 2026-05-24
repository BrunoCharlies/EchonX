/**
 * Safari on iOS (incl. older devices) only allows speechSynthesis after a user gesture.
 * Call synchronously at the start of a click handler — before any await.
 */
export function isAppleMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Parsed from Mobile Safari UA, e.g. iPhone OS 16_7 → 16. */
export function iosMajorVersion() {
  if (typeof navigator === "undefined") return null;
  const match = navigator.userAgent.match(/OS (\d+)[._]/i);
  if (!match) return null;
  const major = Number(match[1]);
  return Number.isFinite(major) ? major : null;
}

/** iPhone 8 Plus era devices (iOS ≤16) often speak faster than utterance.rate. */
export function isLegacyIosSafari() {
  const major = iosMajorVersion();
  return major !== null && major <= 16;
}

export function librarySpeechRateForDevice(requestedRate: number) {
  if (!isLegacyIosSafari()) return requestedRate;
  return Math.min(1, Math.max(0.5, requestedRate * 0.72));
}

export function primeWebSpeechForUserGesture() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.resume();

  if (!isAppleMobileBrowser()) return;

  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0.01;
  utterance.rate = 1;
  utterance.lang = "en-US";
  synth.speak(utterance);
  /** Do not call synth.cancel() here — on slow iPhones it cancels the real book utterance next. */
}

/** Unlocks HTMLAudioElement.play() on iOS when used after Fish TTS fetch. */
export function primeHtmlAudioForUserGesture() {
  if (typeof window === "undefined") return;
  if (!isAppleMobileBrowser()) return;

  try {
    const audio = new Audio();
    audio.volume = 0.01;
    const silent =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    audio.src = silent;
    void audio.play().catch(() => undefined);
  } catch {
    // ignore
  }
}

export function primeLibraryPlaybackForUserGesture() {
  primeWebSpeechForUserGesture();
  primeHtmlAudioForUserGesture();
}
