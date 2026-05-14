/**
 * Supertonic on-device voice (WebAssembly / WebGPU).
 * Ships with Web Speech API playback so the queue player works before WASM weights are wired.
 */
export type SpeakOptions = {
  voice?: "default";
  /** Web Speech API rate: 0.1–10, where 1 is default. We clamp to 0.8–2.0 for UX. */
  rate?: number;
  onEnd?: () => void;
};

export type SupertonicEngine = {
  warmUp: () => Promise<void>;
  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  stop: () => Promise<void>;
};

function clampRate(rate?: number) {
  const r = rate ?? 1;
  return Math.min(2, Math.max(0.8, r));
}

export async function createSupertonicEngine(): Promise<SupertonicEngine> {
  return {
    async warmUp() {
      /* Hook: preload WASM + Supertonic weights when available (NEXT_PUBLIC_SUPERTONIC_ASSET_BASE). */
    },
    async speak(text: string, options?: SpeakOptions) {
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis is not available in this environment.");
        options?.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = clampRate(options?.rate);
      await new Promise<void>((resolve) => {
        utterance.onend = () => {
          options?.onEnd?.();
          resolve();
        };
        utterance.onerror = () => {
          options?.onEnd?.();
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    async stop() {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
  };
}
