export const EMPTY_AUDIOPOST_QUEUE_EVENT = "echonx:empty-audiopost-queue";

export function dispatchEmptyAudiopostQueue() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EMPTY_AUDIOPOST_QUEUE_EVENT));
}
