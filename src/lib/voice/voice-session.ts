import { createVoiceEngine, type VoiceEngine } from "@/lib/voice/voice-engine";

export type VoicePlaybackOwner = "queue-player" | "pdf-reader" | "post-listen";

let enginePromise: Promise<VoiceEngine> | null = null;
let activeOwner: VoicePlaybackOwner | null = null;
const supersededListeners = new Map<VoicePlaybackOwner, Set<(nextOwner: VoicePlaybackOwner) => void>>();

function getListenerSet(owner: VoicePlaybackOwner) {
  let set = supersededListeners.get(owner);
  if (!set) {
    set = new Set();
    supersededListeners.set(owner, set);
  }
  return set;
}

/** Subscribe: another playback source took over — pause your UI immediately. */
export function onVoicePlaybackSuperseded(owner: VoicePlaybackOwner, listener: (nextOwner: VoicePlaybackOwner) => void) {
  getListenerSet(owner).add(listener);
  return () => {
    getListenerSet(owner).delete(listener);
  };
}

export function getActiveVoicePlaybackOwner() {
  return activeOwner;
}

/**
 * Take exclusive playback. Stops current speech and notifies the previous owner to pause its UI.
 */
export async function claimVoicePlayback(owner: VoicePlaybackOwner) {
  const previousOwner = activeOwner;
  activeOwner = owner;

  if (previousOwner && previousOwner !== owner) {
    await stopSharedVoicePlayback();
    for (const listener of getListenerSet(previousOwner)) {
      listener(owner);
    }
  }
}

export function releaseVoicePlayback(owner: VoicePlaybackOwner) {
  if (activeOwner === owner) {
    activeOwner = null;
  }
}

/** One shared TTS instance for the whole app (queue player, PDF reader, post Listen buttons). */
export function getSharedVoiceEngine(): Promise<VoiceEngine> {
  if (!enginePromise) {
    enginePromise = createVoiceEngine();
  }
  return enginePromise;
}

export async function stopSharedVoicePlayback() {
  const engine = await getSharedVoiceEngine();
  await engine.stop();
}
