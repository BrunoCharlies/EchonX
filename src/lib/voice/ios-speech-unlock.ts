/**
 * Safari on iOS (incl. older devices) only allows speechSynthesis after a user gesture.
 * Call synchronously at the start of a click handler — before any await.
 */
export function isAppleMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function primeWebSpeechForUserGesture() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.resume();

  if (!isAppleMobileBrowser()) return;

  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0.01;
  utterance.rate = 1.2;
  utterance.lang = "en-US";
  synth.speak(utterance);
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
