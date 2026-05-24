"use client";

import type { SpeakOptions, VoiceEngine } from "@/lib/voice/voice-engine";

type FishVoiceEngineOptions = {
  /** Defaults to admin lab proxy. Production will use a different route later. */
  ttsPath?: string;
};

/**
 * Client VoiceEngine that plays MP3 from our server proxy (keeps API key off the browser).
 */
function clampVolume(volume?: number) {
  const v = volume ?? 1;
  return Math.min(1, Math.max(0, v));
}

export function createFishVoiceEngine(options: FishVoiceEngineOptions = {}): VoiceEngine {
  const ttsPath = options.ttsPath ?? "/api/admin/lab/tts";
  let generation = 0;
  let outputVolume = 1;
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  const cleanupAudio = () => {
    if (audio) {
      audio.pause();
      audio.src = "";
      audio = null;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };

  return {
    async warmUp() {
      // No-op for remote TTS.
    },
    async speak(text: string, opts?: SpeakOptions) {
      if (typeof window === "undefined") return;
      const run = ++generation;
      cleanupAudio();

      const response = await fetch(ttsPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          text,
          lang: opts?.lang,
          rate: opts?.rate,
        }),
      });

      if (!response.ok) {
        let message = await response.text().catch(() => response.statusText);
        try {
          const parsed = JSON.parse(message) as { error?: string; message?: string };
          message = parsed.error ?? parsed.message ?? message;
        } catch {
          // Plain text error from proxy.
        }
        if (response.status === 402 || /insufficient balance/i.test(message)) {
          throw new Error(
            "Fish API: saldo insuficiente. Recarregue créditos da API no painel Fish (Developers → billing/wallet), não os 200 min do Plus.",
          );
        }
        if (response.status === 403) {
          try {
            const parsed = JSON.parse(message) as {
              error?: string;
              code?: string;
            };
            if (parsed.code === "LIBRARY_QUOTA_EXHAUSTED") {
              throw new Error(
                parsed.error ??
                  "Monthly Library voice allowance used up. Upgrade your plan or wait for renewal.",
              );
            }
          } catch (inner) {
            if (inner instanceof Error && inner.message.includes("allowance")) throw inner;
          }
        }
        throw new Error(message || `Fish TTS proxy failed (${response.status})`);
      }

      if (run !== generation) return;

      const blob = await response.blob();
      const mime = blob.type || response.headers.get("Content-Type") || "";
      if (mime.includes("json") || blob.size < 128) {
        const raw = await blob.text().catch(() => "");
        throw new Error(raw || "Fish TTS returned empty or invalid audio.");
      }
      if (run !== generation) return;

      objectUrl = URL.createObjectURL(blob);
      audio = new Audio(objectUrl);
      const level = clampVolume(opts?.volume ?? outputVolume);
      audio.volume = level;
      outputVolume = level;
      audio.playbackRate = Math.min(2, Math.max(0.5, opts?.rate ?? 1));

      await new Promise<void>((resolve, reject) => {
        if (!audio) {
          resolve();
          return;
        }
        const current = audio;
        const finish = () => {
          current.removeEventListener("ended", finish);
          current.removeEventListener("error", onError);
          if (run === generation) {
            cleanupAudio();
          }
          resolve();
        };
        const onError = () => {
          current.removeEventListener("ended", finish);
          current.removeEventListener("error", onError);
          reject(new Error("Fish audio playback failed."));
        };
        current.addEventListener("ended", finish);
        current.addEventListener("error", onError);
        void current.play().catch(reject);
      });

      if (run === generation) {
        opts?.onEnd?.();
      }
    },
    async pause() {
      audio?.pause();
    },
    async resume() {
      if (audio) {
        await audio.play().catch(() => undefined);
      }
    },
    async stop() {
      generation++;
      cleanupAudio();
    },
    setVolume(volume: number) {
      outputVolume = clampVolume(volume);
      if (audio) {
        audio.volume = outputVolume;
      }
    },
  };
}
