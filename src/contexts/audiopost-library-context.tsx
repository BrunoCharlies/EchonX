"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PdfReadingSource } from "@/components/app/pdf-reading-player";
import {
  fetchLibraryVoiceStatus,
  type LibraryVoiceStatus,
} from "@/lib/voice/library-voice-session";
import {
  DEFAULT_LIBRARY_BAR_SPEED,
  LIBRARY_BAR_LANGUAGE_KEY,
  LIBRARY_BAR_SPEED_KEY,
  type LibraryReadingLanguage,
  readStoredLibraryBarLanguage,
  readStoredLibraryBarSpeed,
  clampLibraryBarSpeed,
} from "@/lib/voice/library-playback-settings";

const LIBRARY_BAR_VOLUME_KEY = "echonx:library-bottom-bar-volume";
export const DEFAULT_LIBRARY_BAR_VOLUME = 0.85;

function readStoredLibraryVolume() {
  if (typeof window === "undefined") return DEFAULT_LIBRARY_BAR_VOLUME;
  const raw = window.localStorage.getItem(LIBRARY_BAR_VOLUME_KEY);
  if (raw == null) return DEFAULT_LIBRARY_BAR_VOLUME;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_LIBRARY_BAR_VOLUME;
  return Math.min(1, Math.max(0, parsed));
}

export type LibraryPlaybackSnapshot = {
  title: string;
  author: string | null;
  preview: string | null;
  error: string | null;
  readerState: "empty" | "loading" | "ready" | "playing" | "paused" | "finished";
  canControl: boolean;
  currentIndex: number;
  segmentCount: number;
};

type AudiopostLibraryContextValue = {
  selectedSource: PdfReadingSource | null;
  setSelectedSource: (source: PdfReadingSource | null) => void;
  playback: LibraryPlaybackSnapshot;
  setPlayback: (patch: Partial<LibraryPlaybackSnapshot>) => void;
  /** Volume for the footer library bar player only (0–1). */
  libraryBarVolume: number;
  setLibraryBarVolume: (volume: number) => void;
  /** Reading speed for the footer library player (0.8–2). */
  libraryBarRate: number;
  setLibraryBarRate: (rate: number) => void;
  /** Voice language for library reading ("auto" detects per segment). */
  libraryBarLanguage: LibraryReadingLanguage;
  setLibraryBarLanguage: (language: LibraryReadingLanguage) => void;
  /** Fish quota + backend from GET /api/library/tts */
  libraryVoiceStatus: LibraryVoiceStatus | null;
  refreshLibraryVoiceStatus: () => Promise<LibraryVoiceStatus>;
};

const defaultPlayback: LibraryPlaybackSnapshot = {
  title: "Select a book",
  author: null,
  preview: null,
  error: null,
  readerState: "empty",
  canControl: false,
  currentIndex: 0,
  segmentCount: 0,
};

const AudiopostLibraryContext = createContext<AudiopostLibraryContextValue | null>(null);

export function AudiopostLibraryProvider({ children }: { children: ReactNode }) {
  const [selectedSource, setSelectedSource] = useState<PdfReadingSource | null>(null);
  const [playback, setPlaybackState] = useState<LibraryPlaybackSnapshot>(defaultPlayback);
  const [libraryBarVolume, setLibraryBarVolumeState] = useState(DEFAULT_LIBRARY_BAR_VOLUME);
  const [libraryBarRate, setLibraryBarRateState] = useState(DEFAULT_LIBRARY_BAR_SPEED);
  const [libraryBarLanguage, setLibraryBarLanguageState] = useState<LibraryReadingLanguage>("auto");
  const [libraryVoiceStatus, setLibraryVoiceStatus] = useState<LibraryVoiceStatus | null>(null);

  const refreshLibraryVoiceStatus = useCallback(async () => {
    const status = await fetchLibraryVoiceStatus();
    setLibraryVoiceStatus(status);
    return status;
  }, []);

  useEffect(() => {
    setLibraryBarVolumeState(readStoredLibraryVolume());
    setLibraryBarRateState(readStoredLibraryBarSpeed());
    setLibraryBarLanguageState(readStoredLibraryBarLanguage());
    void refreshLibraryVoiceStatus();
  }, [refreshLibraryVoiceStatus]);

  const setLibraryBarVolume = useCallback((volume: number) => {
    const next = Math.min(1, Math.max(0, volume));
    setLibraryBarVolumeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIBRARY_BAR_VOLUME_KEY, String(next));
    }
  }, []);

  const setLibraryBarRate = useCallback((rate: number) => {
    const next = clampLibraryBarSpeed(rate);
    setLibraryBarRateState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIBRARY_BAR_SPEED_KEY, String(next));
    }
  }, []);

  const setLibraryBarLanguage = useCallback((language: LibraryReadingLanguage) => {
    setLibraryBarLanguageState(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIBRARY_BAR_LANGUAGE_KEY, language);
    }
  }, []);

  const setPlayback = useCallback((patch: Partial<LibraryPlaybackSnapshot>) => {
    setPlaybackState((prev) => {
      const next = { ...prev, ...patch };
      const unchanged =
        prev.title === next.title &&
        prev.author === next.author &&
        prev.preview === next.preview &&
        prev.error === next.error &&
        prev.readerState === next.readerState &&
        prev.canControl === next.canControl &&
        prev.currentIndex === next.currentIndex &&
        prev.segmentCount === next.segmentCount;
      return unchanged ? prev : next;
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedSource,
      setSelectedSource,
      playback,
      setPlayback,
      libraryBarVolume,
      setLibraryBarVolume,
      libraryBarRate,
      setLibraryBarRate,
      libraryBarLanguage,
      setLibraryBarLanguage,
      libraryVoiceStatus,
      refreshLibraryVoiceStatus,
    }),
    [
      selectedSource,
      playback,
      setPlayback,
      libraryBarVolume,
      setLibraryBarVolume,
      libraryBarRate,
      setLibraryBarRate,
      libraryBarLanguage,
      setLibraryBarLanguage,
      libraryVoiceStatus,
      refreshLibraryVoiceStatus,
    ],
  );

  return <AudiopostLibraryContext.Provider value={value}>{children}</AudiopostLibraryContext.Provider>;
}

export function useAudiopostLibrary() {
  const ctx = useContext(AudiopostLibraryContext);
  if (!ctx) {
    throw new Error("useAudiopostLibrary must be used within AudiopostLibraryProvider");
  }
  return ctx;
}

export function useAudiopostLibraryOptional() {
  return useContext(AudiopostLibraryContext);
}
