"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AudiopostCardPlayerView } from "@/components/app/audiopost-card-player-view";
import {
  ChevronRight,
  ChevronUp,
  ListOrdered,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  UserRoundX,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  claimVoicePlayback,
  getSharedVoiceEngine,
  onVoicePlaybackSuperseded,
  releaseVoicePlayback,
  stopSharedVoicePlayback,
} from "@/lib/voice/voice-session";
import {
  normalizeMirroredPostBodyForListen,
  resolvePlaybackSpeechLocale,
  type PlaybackLanguageSetting,
  type SpeechLocale,
} from "@/lib/voice/post-announcement";
import { isCompatibleSpeechVoiceLang, normalizeSpeechLocale } from "@/lib/voice/speech-locale";
import { prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";
import type { VoiceEngine } from "@/lib/voice/voice-engine";
import type { ListenQueueItem } from "@/components/listen/listen-queue-provider";
import { useListenQueue } from "@/components/listen/listen-queue-provider";
import { getFollowedProfiles, unfollowProfile, type FollowedProfile } from "@/server/actions/listen";
import { dispatchEmptyAudiopostQueue } from "@/lib/audiopost/events";
import { recordListeningSeconds } from "@/lib/listening/weekly-listening-stats";
import { consumeQueueRow, logTextReadEvents } from "@/server/actions/listening-queue";

const TEXT_READ_EVENT_BATCH_SIZE = 5;

const STORAGE_KEY = "echonx:floating-listen-player-position";
const SIZE_STORAGE_KEY = "echonx:floating-listen-player-size";
const LANGUAGE_STORAGE_KEY = "echonx:floating-listen-player-language";
const VOICE_STORAGE_KEY = "echonx:floating-listen-player-voice";
const BACKGROUND_TRACK_STORAGE_KEY = "echonx:floating-listen-player-background-track";
const EDGE_PADDING = 16;
const MIN_PLAYER_WIDTH = 320;
const MIN_PLAYER_HEIGHT = 260;
/** Auto-listen in "general" mode only considers posts newer than this window. Manual Play uses the full queue. */
const TIMELINE_RECENT_WINDOW_MS = 6 * 60 * 60 * 1000;

type Position = { x: number; y: number };
type PlayerSize = { width: number; height: number };
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type BrowserVoiceOption = { voiceURI: string; name: string; lang: string; localService: boolean; default: boolean };
type PlaybackMode = "general" | "profile" | "skip-profile";
type DefaultPlacement = "bottom-right" | "feed-top";
type PlaybackLanguage = PlaybackLanguageSetting;
type BackgroundTrack = "off" | "pulse" | "nebula" | "signal";

const PLAYBACK_LANGUAGES: Array<{ value: PlaybackLanguage; label: string; shortLabel: string }> = [
  { value: "original", label: "Original", shortLabel: "Original" },
  { value: "en-US", label: "English (US)", shortLabel: "EN" },
  { value: "pt-BR", label: "Português (BR)", shortLabel: "PT-BR" },
  { value: "es-ES", label: "Español", shortLabel: "ES" },
  { value: "fr-FR", label: "Français", shortLabel: "FR" },
];

const BACKGROUND_TRACKS: Array<{ value: BackgroundTrack; label: string; shortLabel: string }> = [
  { value: "off", label: "Off", shortLabel: "Off" },
  { value: "pulse", label: "Soft Pulse", shortLabel: "Pulse" },
  { value: "nebula", label: "Nebula Pad", shortLabel: "Nebula" },
  { value: "signal", label: "Signal Flow", shortLabel: "Signal" },
];

function itemTimeMs(item: ListenQueueItem) {
  const time = Date.parse(item.createdAt || "");
  return Number.isNaN(time) ? 0 : time;
}

function newestTimeMs(queue: ListenQueueItem[]) {
  return queue.reduce((max, item) => Math.max(max, itemTimeMs(item)), 0);
}

function recentTimelineCutoffMs() {
  return Date.now() - TIMELINE_RECENT_WINDOW_MS;
}

function formatPostTime(createdAt: string) {
  const time = Date.parse(createdAt || "");
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(time));
}

function clampPosition(pos: Position, width: number, height: number): Position {
  if (typeof window === "undefined") return pos;
  return {
    x: Math.min(Math.max(EDGE_PADDING, pos.x), Math.max(EDGE_PADDING, window.innerWidth - width - EDGE_PADDING)),
    y: Math.min(Math.max(EDGE_PADDING, pos.y), Math.max(EDGE_PADDING, window.innerHeight - height - EDGE_PADDING)),
  };
}

function clampPlayerSize(size: PlayerSize): PlayerSize {
  if (typeof window === "undefined") return size;
  const maxWidth = Math.min(window.innerWidth - EDGE_PADDING * 2, Math.round(window.innerWidth * 0.92));
  const maxHeight = Math.min(window.innerHeight - EDGE_PADDING * 2, Math.round(window.innerHeight * 0.78));
  return {
    width: Math.min(Math.max(MIN_PLAYER_WIDTH, size.width), Math.max(MIN_PLAYER_WIDTH, maxWidth)),
    height: Math.min(Math.max(MIN_PLAYER_HEIGHT, size.height), Math.max(MIN_PLAYER_HEIGHT, maxHeight)),
  };
}

function defaultPosition(width: number, height: number, placement: DefaultPlacement): Position {
  if (typeof window === "undefined") return { x: EDGE_PADDING, y: EDGE_PADDING };
  if (placement === "feed-top") {
    const frame = feedTopFrame();
    return { x: frame.x, y: frame.y };
  }
  return { x: window.innerWidth - width - EDGE_PADDING, y: window.innerHeight - height - EDGE_PADDING };
}

function feedTopFrame() {
  if (typeof window === "undefined") return { x: EDGE_PADDING, y: 88, width: 420 };

  const viewportWidth = window.innerWidth;
  const shellWidth = Math.min(viewportWidth, 1152);
  const sidePadding = viewportWidth >= 1024 ? 32 : viewportWidth >= 640 ? 24 : 16;
  const contentX = (viewportWidth - shellWidth) / 2 + sidePadding;
  const contentWidth = Math.max(0, shellWidth - sidePadding * 2);

  if (viewportWidth < 1024) {
    return {
      x: Math.max(EDGE_PADDING, Math.round(contentX)),
      y: 88,
      width: Math.max(280, Math.round(contentWidth)),
    };
  }

  const leftSidebarWidth = 280;
  const rightSidebarWidth = 300;
  const gridGap = 24;
  const feedWidth = Math.max(280, contentWidth - leftSidebarWidth - rightSidebarWidth - gridGap * 2);

  return {
    x: Math.max(EDGE_PADDING, Math.round(contentX + leftSidebarWidth + gridGap)),
    y: 88,
    width: Math.round(feedWidth),
  };
}

function VoiceWaveform({ active, dense = false }: { active: boolean; dense?: boolean }) {
  const allBars = [26, 42, 58, 36, 64, 48, 78, 44, 34, 56, 72, 40, 62, 88, 54, 38, 70, 46, 60, 34, 80, 52, 42, 68, 36, 58, 74, 46, 32, 54];
  const bars = dense ? allBars.filter((_, i) => i % 2 === 0) : allBars;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.14),transparent_62%)]",
        dense ? "h-9" : "h-24 rounded-2xl",
      )}
    >
      {!dense ? (
        <>
          <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-primary/15" />
          <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-primary/35 shadow-[0_0_24px_hsl(var(--primary)/0.75)]" />
          <div className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary))]" />
        </>
      ) : (
        <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-primary/20" />
      )}
      <div className={cn("flex h-full items-end justify-between", dense ? "gap-0.5 px-2 pb-1.5 pt-1" : "gap-1 px-5")}>
        {bars.map((height, index) => (
          <span
            key={`${height}-${index}`}
            className={cn(
              "rounded-full bg-primary/75 transition-opacity",
              dense ? "w-0.5" : "w-1 shadow-[0_0_10px_hsl(var(--primary)/0.55)]",
              active ? "animate-pulse opacity-100" : "opacity-40",
            )}
            style={{
              height: `${dense ? Math.max(18, height * 0.55) : height}%`,
              animationDelay: `${index * 60}ms`,
              animationDuration: `${700 + (index % 4) * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function isPlaybackLanguage(value: string): value is PlaybackLanguage {
  return PLAYBACK_LANGUAGES.some((language) => language.value === value);
}

function isBackgroundTrack(value: string): value is BackgroundTrack {
  return BACKGROUND_TRACKS.some((track) => track.value === value);
}

function backgroundTrackFrequencies(track: BackgroundTrack) {
  switch (track) {
    case "pulse":
      return [110, 165, 220];
    case "nebula":
      return [98, 147, 196, 294];
    case "signal":
      return [123.47, 185, 246.94, 370];
    default:
      return [];
  }
}

async function haltSpeech() {
  await stopSharedVoicePlayback();
}

/**
 * Premium floating player: play/pause, skip, speaking rate, Zen dimming, and optional auto-advance.
 */
export function FloatingListenPlayer({
  onClose,
  defaultPlacement = "bottom-right",
  resetPositionOnMount = false,
  variant = "floating",
  foldExpanded = false,
  linguetaAnchorRef,
  className,
  getVoiceEngine,
  defaultPlaybackLanguage,
  ignoreStoredPlaybackLanguage = false,
  forceSpeechLocale,
  labSandbox = false,
}: {
  onClose?: () => void;
  defaultPlacement?: DefaultPlacement;
  resetPositionOnMount?: boolean;
  /** `embedded` = legacy; `audiopost-card` = fixed quadrant on /app with lingueta over library. */
  variant?: "floating" | "embedded" | "audiopost-card";
  foldExpanded?: boolean;
  linguetaAnchorRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** Lab sandbox can inject Fish engine; production uses shared Web Speech until wired. */
  getVoiceEngine?: () => Promise<VoiceEngine>;
  /** Overrides localStorage language (e.g. admin voice lab). */
  defaultPlaybackLanguage?: PlaybackLanguage;
  ignoreStoredPlaybackLanguage?: boolean;
  /** When set (e.g. admin lab), TTS + preview always use this locale. */
  forceSpeechLocale?: SpeechLocale;
  /** Admin voice lab: Original default, queue mode, English intro, fresh session. */
  labSandbox?: boolean;
}) {
  const isAudiopostCard = variant === "audiopost-card";
  const isEmbedded = variant === "embedded";
  const embeddedDense = isEmbedded;
  /** Lab + /app Now Playing + floating Audiopost: ordered queue (not live-timeline mode). */
  const useQueuePlayback = isAudiopostCard || labSandbox;
  const initialPlaybackLanguage =
    defaultPlaybackLanguage ?? (useQueuePlayback ? "original" : "en-US");
  const [linguetaOpen, setLinguetaOpen] = useState(false);
  const { items, refresh } = useListenQueue();
  const listenItems = useMemo(
    () =>
      items.map((item) => {
        const raw = item.body ?? "";
        const body = normalizeMirroredPostBodyForListen(raw);
        return { ...item, body, displayBody: body };
      }),
    [items],
  );
  const [expanded, setExpanded] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [followedProfiles, setFollowedProfiles] = useState<FollowedProfile[]>([]);
  const [profileBusyId, setProfileBusyId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    useQueuePlayback || forceSpeechLocale ? "profile" : "general",
  );
  const [skippedProfileIds, setSkippedProfileIds] = useState<string[]>([]);
  const [rate, setRate] = useState(1);
  const [playbackLanguage, setPlaybackLanguage] = useState<PlaybackLanguage>(initialPlaybackLanguage);
  const [playbackVoiceURI, setPlaybackVoiceURI] = useState("auto");
  const [browserVoices, setBrowserVoices] = useState<BrowserVoiceOption[]>([]);
  const [backgroundTrack, setBackgroundTrack] = useState<BackgroundTrack>("off");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [playbackHint, setPlaybackHint] = useState<string | null>(null);
  const [nowPlayingItem, setNowPlayingItem] = useState<ListenQueueItem | null>(null);
  const [sessionCompletedQueueIds, setSessionCompletedQueueIds] = useState<number[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [playerSize, setPlayerSize] = useState<PlayerSize | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startPosition: Position;
    startSize: PlayerSize;
  } | null>(null);
  const engineRef = useRef<VoiceEngine | null>(null);
  const backgroundAudioRef = useRef<{
    context: AudioContext;
    gain: GainNode;
    oscillators: OscillatorNode[];
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
  } | null>(null);
  const backgroundRunIdRef = useRef(0);
  const stopRef = useRef(false);
  const pauseRequestedRef = useRef(false);
  const loopRunningRef = useRef(false);
  const loopRunIdRef = useRef(0);
  const playingRef = useRef(false);
  const activeQueueIdRef = useRef<number | null>(null);
  const activeAuthorProfileIdRef = useRef<string | null>(null);
  const lastAutoPlayedQueueIdRef = useRef<number | null>(null);
  const timelineCursorMsRef = useRef<number>(0);
  const timelineInitializedRef = useRef(false);
  const timelineSeenQueueIdsRef = useRef<Set<number>>(new Set());
  const completedQueueIdsRef = useRef<Set<number>>(new Set());
  const playbackModeRef = useRef<PlaybackMode>(
    useQueuePlayback || forceSpeechLocale ? "profile" : "general",
  );
  const queuePlaybackBootstrappedRef = useRef(false);
  const activeProfileIdRef = useRef<string | null>(null);
  const skippedProfileIdsRef = useRef<Set<string>>(new Set());
  const rateRef = useRef(rate);
  const playbackLanguageRef = useRef<PlaybackLanguage>(initialPlaybackLanguage);
  const playbackVoiceURIRef = useRef("auto");
  const backgroundTrackRef = useRef<BackgroundTrack>("off");
  const autoRef = useRef(autoAdvance);
  const pendingQueueRefreshRef = useRef(false);
  const readEventBufferRef = useRef<{ postId: string; charsCount: number }[]>([]);

  const markQueueItemCompleted = useCallback((queueId: number) => {
    completedQueueIdsRef.current.add(queueId);
    setSessionCompletedQueueIds((prev) => (prev.includes(queueId) ? prev : [...prev, queueId]));
  }, []);

  const flushReadEvents = useCallback(async () => {
    const batch = readEventBufferRef.current.splice(0);
    if (!batch.length) return;
    try {
      await logTextReadEvents(batch);
    } catch (error) {
      console.warn("[listen-player] could not log text read events", error);
    }
  }, []);

  const flushPendingQueueRefresh = useCallback(() => {
    if (!pendingQueueRefreshRef.current) return;
    pendingQueueRefreshRef.current = false;
    void refresh();
  }, [refresh]);

  const scheduleQueueRefresh = useCallback(() => {
    if (loopRunningRef.current || (playingRef.current && !pauseRequestedRef.current)) {
      pendingQueueRefreshRef.current = true;
      return;
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    playbackLanguageRef.current = playbackLanguage;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, playbackLanguage);
    } catch {
      // Language preference is optional.
    }
  }, [playbackLanguage]);
  useEffect(() => {
    playbackVoiceURIRef.current = playbackVoiceURI;
    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, playbackVoiceURI);
    } catch {
      // Voice preference is optional.
    }
  }, [playbackVoiceURI]);
  useEffect(() => {
    backgroundTrackRef.current = backgroundTrack;
    try {
      window.localStorage.setItem(BACKGROUND_TRACK_STORAGE_KEY, backgroundTrack);
    } catch {
      // Background preference is optional.
    }
  }, [backgroundTrack]);
  useEffect(() => {
    autoRef.current = autoAdvance;
  }, [autoAdvance]);
  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);
  useEffect(() => {
    skippedProfileIdsRef.current = new Set(skippedProfileIds);
  }, [skippedProfileIds]);
  useEffect(() => {
    if (playbackVoiceURI === "auto" || !browserVoices.length) return;
    const lang = playbackLanguage === "original" ? "en-US" : playbackLanguage;
    const selectedVoice = browserVoices.find((voice) => voice.voiceURI === playbackVoiceURI);
    if (!selectedVoice || !isCompatibleSpeechVoiceLang(selectedVoice.lang, lang)) {
      setPlaybackVoiceURI("auto");
    }
  }, [browserVoices, playbackLanguage, playbackVoiceURI]);

  function setPlaybackModeImmediate(mode: PlaybackMode) {
    playbackModeRef.current = mode;
    setPlaybackMode(mode);
  }

  function setSkippedProfileIdsImmediate(ids: string[]) {
    skippedProfileIdsRef.current = new Set(ids);
    setSkippedProfileIds(ids);
  }

  const loadFollowedProfiles = useCallback(async () => {
    const profiles = await getFollowedProfiles();
    setFollowedProfiles(profiles);
  }, []);

  useEffect(() => {
    function onQueueRefresh() {
      void refresh();
      void loadFollowedProfiles();
    }

    window.addEventListener("echonx:listening-queue-refresh", onQueueRefresh);
    return () => window.removeEventListener("echonx:listening-queue-refresh", onQueueRefresh);
  }, [loadFollowedProfiles, refresh]);

  useEffect(() => {
    void loadFollowedProfiles();
  }, [loadFollowedProfiles]);

  useEffect(() => {
    const frame = defaultPlacement === "feed-top" ? feedTopFrame() : null;
    const fallbackWidth = frame?.width ?? 420;
    const width = playerRef.current?.offsetWidth ?? fallbackWidth;
    const height = playerRef.current?.offsetHeight ?? 520;
    let nextSize = clampPlayerSize({ width, height });
    try {
      const storedSize = window.localStorage.getItem(SIZE_STORAGE_KEY);
      if (storedSize) {
        const parsed = JSON.parse(storedSize) as Partial<PlayerSize>;
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          nextSize = clampPlayerSize({ width: parsed.width, height: parsed.height });
        }
      }
    } catch {
      // Ignore malformed localStorage values and use the rendered size.
    }
    setPlayerSize(nextSize);

    const fallback = frame ? { x: frame.x, y: frame.y } : defaultPosition(nextSize.width, nextSize.height, defaultPlacement);

    if (resetPositionOnMount) {
      setPosition(clampPosition(fallback, nextSize.width, nextSize.height));
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Position>;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition({ x: parsed.x, y: parsed.y }, nextSize.width, nextSize.height));
          return;
        }
      }
    } catch {
      // Ignore malformed localStorage values and use the default bottom-right position.
    }

    setPosition(clampPosition(fallback, nextSize.width, nextSize.height));
  }, [defaultPlacement, resetPositionOnMount]);

  useEffect(() => {
    function onResize() {
      setPlayerSize((current) => {
        const nextSize = clampPlayerSize(current ?? { width: playerRef.current?.offsetWidth ?? 420, height: playerRef.current?.offsetHeight ?? 520 });
        setPosition((positionValue) => (positionValue ? clampPosition(positionValue, nextSize.width, nextSize.height) : positionValue));
        return nextSize;
      });
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!position) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Persistence is a convenience only.
    }
  }, [position]);

  useEffect(() => {
    if (!playerSize) return;
    try {
      window.localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(playerSize));
    } catch {
      // Persistence is a convenience only.
    }
  }, [playerSize]);

  useEffect(() => {
    if (!labSandbox && !forceSpeechLocale) return;
    completedQueueIdsRef.current = new Set();
    setSessionCompletedQueueIds([]);
    setNowPlayingItem(null);
    timelineSeenQueueIdsRef.current = new Set();
    timelineInitializedRef.current = false;
    playbackModeRef.current = "profile";
    setPlaybackMode("profile");
  }, [forceSpeechLocale, labSandbox]);

  useEffect(() => {
    if (defaultPlaybackLanguage) {
      setPlaybackLanguage(defaultPlaybackLanguage);
      playbackLanguageRef.current = defaultPlaybackLanguage;
      return;
    }
    if (ignoreStoredPlaybackLanguage) return;
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && isPlaybackLanguage(stored)) {
        setPlaybackLanguage(stored);
        playbackLanguageRef.current = stored;
      }
    } catch {
      // Ignore localStorage errors and use default English.
    }
  }, [defaultPlaybackLanguage, ignoreStoredPlaybackLanguage]);

  useEffect(() => {
    function loadBrowserVoices() {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const voices = window.speechSynthesis
        .getVoices()
        .map((voice) => ({
          voiceURI: voice.voiceURI,
          name: voice.name,
          lang: voice.lang,
          localService: voice.localService,
          default: voice.default,
        }))
        .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
      setBrowserVoices(voices);
    }

    loadBrowserVoices();
    const timeout = window.setTimeout(loadBrowserVoices, 600);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", loadBrowserVoices);
    }

    try {
      const stored = window.localStorage.getItem(VOICE_STORAGE_KEY);
      if (stored) {
        setPlaybackVoiceURI(stored);
        playbackVoiceURIRef.current = stored;
      }
    } catch {
      // Ignore localStorage errors and use automatic voice selection.
    }

    return () => {
      window.clearTimeout(timeout);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener("voiceschanged", loadBrowserVoices);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BACKGROUND_TRACK_STORAGE_KEY);
      if (stored && isBackgroundTrack(stored)) {
        setBackgroundTrack(stored);
        backgroundTrackRef.current = stored;
      }
    } catch {
      // Ignore localStorage errors and use Off.
    }
  }, []);

  useEffect(() => {
    if (!useQueuePlayback) return;
    if (queuePlaybackBootstrappedRef.current) return;
    queuePlaybackBootstrappedRef.current = true;
    activeProfileIdRef.current = null;
    setSkippedProfileIdsImmediate([]);
    setPlaybackModeImmediate("profile");
    timelineSeenQueueIdsRef.current = new Set();
    timelineInitializedRef.current = false;
    setAutoListen(true);
    void refresh();
  }, [refresh, useQueuePlayback]);

  useEffect(() => {
    if (useQueuePlayback || labSandbox) return;
    activeProfileIdRef.current = null;
    setSkippedProfileIdsImmediate([]);
    setPlaybackModeImmediate("general");
    timelineCursorMsRef.current = recentTimelineCutoffMs();
    timelineSeenQueueIdsRef.current = new Set();
    timelineInitializedRef.current = true;
    setAutoListen(true);
    void refresh();
  }, [labSandbox, refresh, useQueuePlayback]);

  useEffect(() => {
    const liveIds = new Set(listenItems.map((item) => item.queueId));
    for (const queueId of completedQueueIdsRef.current) {
      if (!liveIds.has(queueId)) {
        completedQueueIdsRef.current.delete(queueId);
      }
    }
    setSessionCompletedQueueIds((prev) => prev.filter((id) => liveIds.has(id)));
  }, [listenItems]);

  function moveTo(clientX: number, clientY: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const width = playerSize?.width ?? playerRef.current?.offsetWidth ?? 420;
    const height = playerSize?.height ?? playerRef.current?.offsetHeight ?? 520;
    setPosition(clampPosition({ x: clientX - drag.offsetX, y: clientY - drag.offsetY }, width, height));
  }

  function resizeTo(clientX: number, clientY: number) {
    const resize = resizeRef.current;
    if (!resize) return;
    const dx = clientX - resize.startX;
    const dy = clientY - resize.startY;
    const affectsLeft = resize.edge.includes("w");
    const affectsRight = resize.edge.includes("e");
    const affectsTop = resize.edge.includes("n");
    const affectsBottom = resize.edge.includes("s");

    const width = resize.startSize.width + (affectsRight ? dx : 0) - (affectsLeft ? dx : 0);
    const height = resize.startSize.height + (affectsBottom ? dy : 0) - (affectsTop ? dy : 0);
    const clampedSize = clampPlayerSize({ width, height });

    let x = resize.startPosition.x;
    let y = resize.startPosition.y;
    if (affectsLeft) x = resize.startPosition.x + resize.startSize.width - clampedSize.width;
    if (affectsTop) y = resize.startPosition.y + resize.startSize.height - clampedSize.height;

    const clampedPosition = clampPosition({ x, y }, clampedSize.width, clampedSize.height);
    setPlayerSize(clampedSize);
    setPosition(clampedPosition);
  }

  function startResize(edge: ResizeEdge, event: ReactPointerEvent<HTMLDivElement>) {
    const rect = playerRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      pointerId: event.pointerId,
      edge,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: position ?? { x: rect.left, y: rect.top },
      startSize: playerSize ?? { width: rect.width, height: rect.height },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function stopResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (resizeRef.current?.pointerId === event.pointerId) {
      resizeRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const fetchQueue = useCallback(async () => {
    const res = await fetch("/api/listening/queue", { cache: "no-store" });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: ListenQueueItem[] };
    return json.items ?? [];
  }, []);

  const applyQueueOrdering = useCallback(
    (queue: ListenQueueItem[], completed: Set<number>, mode: PlaybackMode, skipped: string[]) => {
      const skippedSet = new Set(skipped);
      let filtered = queue.filter((item) => !completed.has(item.queueId));
      if (mode === "profile" && activeProfileIdRef.current) {
        filtered = filtered.filter((item) => item.authorProfileId === activeProfileIdRef.current);
      } else if (mode === "skip-profile" && skippedSet.size) {
        filtered = filtered.filter(
          (item) => !item.authorProfileId || !skippedSet.has(item.authorProfileId),
        );
      }

      return [...filtered].sort((a, b) => {
        const aTime = Date.parse(a.createdAt || "");
        const bTime = Date.parse(b.createdAt || "");
        const safeA = Number.isNaN(aTime) ? 0 : aTime;
        const safeB = Number.isNaN(bTime) ? 0 : bTime;
        if (safeA !== safeB) return mode === "general" ? safeB - safeA : safeA - safeB;
        return a.queueId - b.queueId;
      });
    },
    [],
  );

  const orderQueue = useCallback(
    (queue: ListenQueueItem[]) => applyQueueOrdering(queue, completedQueueIdsRef.current, playbackModeRef.current, skippedProfileIds),
    [applyQueueOrdering, skippedProfileIds],
  );

  const getTimelineNewItems = useCallback((queue: ListenQueueItem[]) => {
    const cursor = Math.max(timelineCursorMsRef.current, recentTimelineCutoffMs());
    const seen = timelineSeenQueueIdsRef.current;
    return [...queue]
      .filter((item) => {
        const time = itemTimeMs(item);
        return !completedQueueIdsRef.current.has(item.queueId) && (time > cursor || (time === cursor && !seen.has(item.queueId)));
      })
      .sort((a, b) => {
        const diff = itemTimeMs(b) - itemTimeMs(a);
        return diff !== 0 ? diff : a.queueId - b.queueId;
      });
  }, []);

  const getEngine = useCallback(async () => {
    const factory = getVoiceEngine ?? getSharedVoiceEngine;
    engineRef.current = await factory();
    return engineRef.current;
  }, [getVoiceEngine]);

  const stopBackgroundTrack = useCallback(() => {
    backgroundRunIdRef.current++;
    const audio = backgroundAudioRef.current;
    if (!audio) return;
    backgroundAudioRef.current = null;
    const now = audio.context.currentTime;
    audio.gain.gain.cancelScheduledValues(now);
    audio.gain.gain.setValueAtTime(0, now);
    audio.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Oscillator may have already stopped.
      }
    });
    try {
      audio.lfo?.stop();
    } catch {
      // LFO may have already stopped.
    }
    void audio.context.close().catch(() => undefined);
  }, []);

  const startBackgroundTrack = useCallback(
    async (track: BackgroundTrack) => {
      stopBackgroundTrack();
      if (track === "off" || typeof window === "undefined") return;
      const backgroundRunId = ++backgroundRunIdRef.current;

      const AudioContextCtor =
        window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const frequencies = backgroundTrackFrequencies(track);
      if (!frequencies.length) return;

      const context = new AudioContextCtor();
      await context.resume().catch(() => undefined);
      if (backgroundRunId !== backgroundRunIdRef.current) {
        void context.close().catch(() => undefined);
        return;
      }
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();

      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.6);
      filter.type = "lowpass";
      filter.frequency.value = track === "signal" ? 740 : 520;
      filter.Q.value = 0.7;
      lfo.frequency.value = track === "pulse" ? 0.18 : track === "nebula" ? 0.08 : 0.12;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      filter.connect(gain);
      gain.connect(context.destination);

      const oscillators = frequencies.map((frequency, index) => {
        const oscillator = context.createOscillator();
        const oscillatorGain = context.createGain();
        oscillator.type = index % 2 === 0 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index % 2 === 0 ? -4 : 5;
        oscillatorGain.gain.value = 1 / frequencies.length;
        oscillator.connect(oscillatorGain);
        oscillatorGain.connect(filter);
        oscillator.start();
        return oscillator;
      });

      lfo.start();
      if (backgroundRunId !== backgroundRunIdRef.current) {
        oscillators.forEach((oscillator) => {
          try {
            oscillator.stop();
          } catch {
            // Oscillator may have already stopped.
          }
        });
        try {
          lfo.stop();
        } catch {
          // LFO may have already stopped.
        }
        void context.close().catch(() => undefined);
        return;
      }
      backgroundAudioRef.current = { context, gain, oscillators, lfo, lfoGain };
    },
    [stopBackgroundTrack],
  );

  useEffect(() => {
    return () => stopBackgroundTrack();
  }, [stopBackgroundTrack]);

  useEffect(() => {
    return onVoicePlaybackSuperseded("queue-player", () => {
      loopRunIdRef.current++;
      loopRunningRef.current = false;
      pauseRequestedRef.current = true;
      stopRef.current = true;
      playingRef.current = false;
      autoRef.current = false;
      setAutoListen(false);
      setPlaying(false);
      setPaused(true);
      stopBackgroundTrack();
      void haltSpeech();
      activeQueueIdRef.current = null;
      activeAuthorProfileIdRef.current = null;
      setNowPlayingItem(null);
    });
  }, [stopBackgroundTrack]);

  const playOne = useCallback(
    async (head: ListenQueueItem, runId: number) => {
      if (runId !== loopRunIdRef.current) return false;
      const text = head.body ?? "";
      const normalizedBody = normalizeMirroredPostBodyForListen(text);
      const itemForDisplay = { ...head, body: normalizedBody, displayBody: normalizedBody };
      setNowPlayingItem(itemForDisplay);
      activeQueueIdRef.current = head.queueId;
      activeAuthorProfileIdRef.current = head.authorProfileId ?? null;
      if (!text.trim()) {
        try {
          await consumeQueueRow(head.queueId);
          markQueueItemCompleted(head.queueId);
          setNowPlayingItem(null);
        } catch (error) {
          console.warn("[listen-player] could not consume empty queue row", error);
          return false;
        }
        scheduleQueueRefresh();
        return true;
      }
      const engine = await getEngine();
      await engine.warmUp();
      const language = playbackLanguageRef.current;
      const speechLocale = normalizeSpeechLocale(
        forceSpeechLocale ?? resolvePlaybackSpeechLocale(language, text),
      );
      const speechText = prepareMirroredPostForSpeech(text);
      const voiceURI = playbackVoiceURIRef.current;
      await startBackgroundTrack(backgroundTrackRef.current);
      if (runId !== loopRunIdRef.current || stopRef.current || pauseRequestedRef.current) return false;
      try {
        await engine.speak(speechText, {
          rate: rateRef.current,
          lang: speechLocale,
          voiceURI: voiceURI === "auto" ? undefined : voiceURI,
        });
      } catch (error) {
        console.warn("[listen-player] speech stopped before the queue item finished", error);
        return false;
      } finally {
        stopBackgroundTrack();
      }
      if (runId !== loopRunIdRef.current || stopRef.current || pauseRequestedRef.current) return false;
      try {
        await consumeQueueRow(head.queueId);
        markQueueItemCompleted(head.queueId);
      } catch (error) {
        console.warn("[listen-player] could not consume queue row", error);
        return false;
      }
      readEventBufferRef.current.push({ postId: head.postId, charsCount: speechText.length });
      if (readEventBufferRef.current.length >= TEXT_READ_EVENT_BATCH_SIZE) {
        void flushReadEvents();
      }
      scheduleQueueRefresh();
      return true;
    },
    [flushReadEvents, getEngine, markQueueItemCompleted, scheduleQueueRefresh, startBackgroundTrack, stopBackgroundTrack],
  );

  const runQueueLoop = useCallback(async () => {
    if (loopRunningRef.current) return;
    await claimVoicePlayback("queue-player");
    const runId = ++loopRunIdRef.current;
    loopRunningRef.current = true;
    stopRef.current = false;
    pauseRequestedRef.current = false;
    setPaused(false);
    setPlaying(true);
    try {
      while (!stopRef.current && runId === loopRunIdRef.current) {
        const q = orderQueue(await fetchQueue());
        if (!q.length) break;
        const head = q[0];
        const didComplete = await playOne(head, runId);
        if (!didComplete) break;
        if (!autoRef.current) break;
      }
    } finally {
      if (runId === loopRunIdRef.current) {
        loopRunningRef.current = false;
        setPlaying(false);
        if (!pauseRequestedRef.current) setPaused(false);
        activeQueueIdRef.current = null;
        activeAuthorProfileIdRef.current = null;
        setNowPlayingItem(null);
        flushPendingQueueRefresh();
        void flushReadEvents();
      }
    }
  }, [fetchQueue, flushPendingQueueRefresh, flushReadEvents, orderQueue, playOne]);

  const runTimelineBatch = useCallback(
    async (initialBatch?: ListenQueueItem[]) => {
      if (loopRunningRef.current) return;
      const batch = initialBatch ?? getTimelineNewItems(await fetchQueue());
      if (!batch.length) return;

      await claimVoicePlayback("queue-player");
      const runId = ++loopRunIdRef.current;
      loopRunningRef.current = true;
      stopRef.current = false;
      pauseRequestedRef.current = false;
      setPaused(false);
      setPlaying(true);

      try {
        const completedItems: ListenQueueItem[] = [];
        for (const item of batch) {
          if (stopRef.current || runId !== loopRunIdRef.current) break;
          const didComplete = await playOne(item, runId);
          if (!didComplete) break;
          completedItems.push(item);
          timelineSeenQueueIdsRef.current.add(item.queueId);
        }
        if (completedItems.length) {
          timelineCursorMsRef.current = Math.max(timelineCursorMsRef.current, newestTimeMs(completedItems));
        }
      } finally {
        if (runId === loopRunIdRef.current) {
          loopRunningRef.current = false;
          setPlaying(false);
          if (!pauseRequestedRef.current) setPaused(false);
          activeQueueIdRef.current = null;
          activeAuthorProfileIdRef.current = null;
          setNowPlayingItem(null);
          flushPendingQueueRefresh();
          void flushReadEvents();
        }
      }
    },
    [fetchQueue, flushPendingQueueRefresh, flushReadEvents, getTimelineNewItems, playOne],
  );

  async function play() {
    setPlaybackHint(null);

    if (playing && !paused) {
      await pause();
      return;
    }

    if (paused) {
      pauseRequestedRef.current = false;
      stopRef.current = false;
      setPaused(false);
    }

    const q = orderQueue(
      listenItems.length
        ? listenItems
        : (await fetchQueue()).map((item) => {
            const body = normalizeMirroredPostBodyForListen(item.body ?? "");
            return { ...item, body, displayBody: body };
          }),
    );
    if (!q.length) {
      if (!isAudiopostCard) {
        setPlaybackHint("No posts in your Audiopost queue yet. Follow profiles or wait for new posts.");
      }
      dispatchEmptyAudiopostQueue();
      return;
    }

    pauseRequestedRef.current = false;
    stopRef.current = false;
    setPaused(false);
    setAutoListen(autoAdvance);

    if (autoAdvance) {
      await runQueueLoop();
      return;
    }

    await claimVoicePlayback("queue-player");
    const runId = ++loopRunIdRef.current;
    loopRunningRef.current = true;
    setPlaying(true);
    try {
      const didComplete = await playOne(q[0], runId);
      if (!didComplete && runId === loopRunIdRef.current && !isAudiopostCard) {
        setPlaybackHint("Playback was interrupted. Tap Play again to continue.");
      }
    } finally {
      if (runId === loopRunIdRef.current) {
        loopRunningRef.current = false;
        setPlaying(false);
        if (!pauseRequestedRef.current) setPaused(false);
        activeQueueIdRef.current = null;
        activeAuthorProfileIdRef.current = null;
        setNowPlayingItem(null);
        flushPendingQueueRefresh();
        void flushReadEvents();
      }
    }
  }

  async function pause() {
    loopRunIdRef.current++;
    loopRunningRef.current = false;
    pauseRequestedRef.current = true;
    stopRef.current = true;
    playingRef.current = false;
    autoRef.current = false;
    setAutoListen(false);
    setPlaying(false);
    setPaused(true);
    stopBackgroundTrack();
    await haltSpeech();
    activeQueueIdRef.current = null;
    activeAuthorProfileIdRef.current = null;
    setNowPlayingItem(null);
    flushPendingQueueRefresh();
    void flushReadEvents();
  }

  async function stop() {
    loopRunIdRef.current++;
    loopRunningRef.current = false;
    stopRef.current = true;
    pauseRequestedRef.current = false;
    playingRef.current = false;
    autoRef.current = false;
    setAutoListen(false);
    setPlaying(false);
    setPaused(false);
    stopBackgroundTrack();
    await haltSpeech();
    releaseVoicePlayback("queue-player");
    activeQueueIdRef.current = null;
    activeAuthorProfileIdRef.current = null;
    setNowPlayingItem(null);
    flushPendingQueueRefresh();
    void flushReadEvents();
  }

  async function skipPost() {
    loopRunIdRef.current++;
    loopRunningRef.current = false;
    stopRef.current = true;
    pauseRequestedRef.current = false;
    await haltSpeech();
    stopBackgroundTrack();
    const q = orderQueue(
      listenItems.length
        ? listenItems
        : (await fetchQueue()).map((item) => {
            const body = normalizeMirroredPostBodyForListen(item.body ?? "");
            return { ...item, body, displayBody: body };
          }),
    );
    if (!q.length) return;
    if (!activeQueueIdRef.current && !playingRef.current) {
      await runQueueLoop();
      return;
    }
    const current = q.find((item) => item.queueId === activeQueueIdRef.current) ?? q[0];
    if (current.authorProfileId) {
      activeProfileIdRef.current = current.authorProfileId;
      setPlaybackModeImmediate("profile");
    }
    const skippedId = activeQueueIdRef.current ?? current.queueId;
    markQueueItemCompleted(skippedId);
    await consumeQueueRow(skippedId);
    await refresh();
    setPlaying(false);
    setPaused(false);
    setNowPlayingItem(null);
    activeQueueIdRef.current = null;
    activeAuthorProfileIdRef.current = null;
    if (autoRef.current) void runQueueLoop();
  }

  async function skipProfile() {
    loopRunIdRef.current++;
    loopRunningRef.current = false;
    stopRef.current = true;
    pauseRequestedRef.current = false;
    await haltSpeech();
    stopBackgroundTrack();
    const q = orderQueue(
      listenItems.length
        ? listenItems
        : (await fetchQueue()).map((item) => {
            const body = normalizeMirroredPostBodyForListen(item.body ?? "");
            return { ...item, body, displayBody: body };
          }),
    );
    const current = q.find((item) => item.queueId === activeQueueIdRef.current) ?? q[0];
    const profileId = activeAuthorProfileIdRef.current ?? current?.authorProfileId ?? null;

    if (profileId) {
      const nextSkippedIds = skippedProfileIdsRef.current.has(profileId)
        ? [...skippedProfileIdsRef.current]
        : [...skippedProfileIdsRef.current, profileId];
      setSkippedProfileIdsImmediate(nextSkippedIds);
      activeProfileIdRef.current = null;
      setPlaybackModeImmediate("skip-profile");
    }

    const skippedQueueId = activeQueueIdRef.current ?? current?.queueId;
    if (skippedQueueId) {
      markQueueItemCompleted(skippedQueueId);
      await consumeQueueRow(skippedQueueId);
      await refresh();
    }

    setPlaying(false);
    setPaused(false);
    setNowPlayingItem(null);
    activeQueueIdRef.current = null;
    activeAuthorProfileIdRef.current = null;
    if (autoRef.current) void runQueueLoop();
  }

  async function playGeneralPosts() {
    loopRunIdRef.current++;
    loopRunningRef.current = false;
    stopRef.current = true;
    pauseRequestedRef.current = false;
    await haltSpeech();
    stopBackgroundTrack();
    activeProfileIdRef.current = null;
    setSkippedProfileIdsImmediate([]);
    setPlaybackModeImmediate("general");
    timelineCursorMsRef.current = recentTimelineCutoffMs();
    timelineSeenQueueIdsRef.current = new Set();
    timelineInitializedRef.current = true;
    setPlaying(false);
    setPaused(false);
    activeQueueIdRef.current = null;
    activeAuthorProfileIdRef.current = null;
    lastAutoPlayedQueueIdRef.current = null;
    await refresh();
    setAutoListen(true);
  }

  async function removeFollowedProfile(profileId: string) {
    setProfileError(null);
    setProfileBusyId(profileId);
    try {
      const result = await unfollowProfile(profileId);
      if (!result.ok) {
        setProfileError(result.error);
        return;
      }
      setFollowedProfiles((profiles) => profiles.filter((profile) => profile.id !== profileId));
      await refresh();
    } finally {
      setProfileBusyId(null);
    }
  }

  const completedIdSet = useMemo(() => {
    const merged = new Set(sessionCompletedQueueIds);
    for (const id of completedQueueIdsRef.current) merged.add(id);
    return merged;
  }, [sessionCompletedQueueIds]);

  const storedQueueItems = useMemo(
    () => applyQueueOrdering(listenItems, completedIdSet, playbackMode, skippedProfileIds),
    [applyQueueOrdering, completedIdSet, listenItems, playbackMode, skippedProfileIds],
  );
  const orderedItems = playbackMode === "general" ? getTimelineNewItems(listenItems) : storedQueueItems;
  const actionableItems = orderedItems.length ? orderedItems : storedQueueItems;
  const hasStoredQueue = storedQueueItems.length > 0;
  const isSpeaking = playing && !paused;
  const displayItem =
    (playing || paused) && nowPlayingItem
      ? nowPlayingItem
      : (storedQueueItems[0] ?? actionableItems[0] ?? null);
  const headPostTime = displayItem ? formatPostTime(displayItem.createdAt) : null;
  const queuePreview = actionableItems.slice(0, 3);
  const statusLabel = isSpeaking ? "Reading now" : paused ? "Paused" : playbackMode === "general" ? "Live timeline" : "Queue ready";
  const languageLabel =
    PLAYBACK_LANGUAGES.find((language) => language.value === playbackLanguage)?.shortLabel ?? "Original";
  const voiceLanguage =
    playbackLanguage === "original" && displayItem?.body
      ? resolvePlaybackSpeechLocale("original", displayItem.body)
      : playbackLanguage === "original"
        ? "en-US"
        : playbackLanguage;
  const headDisplayBody = displayItem?.displayBody ?? displayItem?.body ?? "";
  const waitingCount = storedQueueItems.length;
  const queuedCount = useMemo(() => {
    const remaining = storedQueueItems.length;
    if (!remaining) return 0;
    if ((playing || paused) && nowPlayingItem && storedQueueItems.some((i) => i.queueId === nowPlayingItem.queueId)) {
      return Math.max(0, remaining - 1);
    }
    return remaining;
  }, [storedQueueItems, playing, paused, nowPlayingItem]);
  const compatibleVoices = browserVoices.filter((voice) =>
    isCompatibleSpeechVoiceLang(voice.lang, voiceLanguage),
  );
  const selectedVoiceLabel =
    playbackVoiceURI === "auto"
      ? "Auto"
      : (browserVoices.find((voice) => voice.voiceURI === playbackVoiceURI)?.name ?? "Auto");
  const backgroundTrackLabel = BACKGROUND_TRACKS.find((track) => track.value === backgroundTrack)?.shortLabel ?? "Off";
  const playerStyle = position
    ? { left: position.x, top: position.y, ...(playerSize ? { width: playerSize.width, height: playerSize.height } : {}) }
    : undefined;

  useEffect(() => {
    if (playbackMode !== "general" || timelineInitializedRef.current || !listenItems.length) return;
    timelineCursorMsRef.current = recentTimelineCutoffMs();
    timelineSeenQueueIdsRef.current = new Set();
    timelineInitializedRef.current = true;
  }, [listenItems, playbackMode]);

  const queueHeadId = actionableItems[0]?.queueId ?? null;

  useEffect(() => {
    if (
      !autoListen ||
      !autoRef.current ||
      paused ||
      pauseRequestedRef.current ||
      stopRef.current ||
      playingRef.current ||
      loopRunningRef.current ||
      !queueHeadId
    )
      return;
    if (playbackModeRef.current === "general") {
      const batch = getTimelineNewItems(listenItems.length ? listenItems : []);
      const nextQueueId = batch[0]?.queueId ?? null;
      if (!nextQueueId || lastAutoPlayedQueueIdRef.current === nextQueueId) return;
      lastAutoPlayedQueueIdRef.current = nextQueueId;
      void runTimelineBatch(batch);
      return;
    }
    if (!queueHeadId || lastAutoPlayedQueueIdRef.current === queueHeadId) return;
    lastAutoPlayedQueueIdRef.current = queueHeadId;
    void runQueueLoop();
  }, [autoListen, getTimelineNewItems, listenItems, paused, queueHeadId, runQueueLoop, runTimelineBatch]);

  useEffect(() => {
    if (!isSpeaking) return;
    const id = window.setInterval(() => recordListeningSeconds(1), 1000);
    return () => window.clearInterval(id);
  }, [isSpeaking]);

  if (isAudiopostCard) {
    return (
      <AudiopostCardPlayerView
        items={listenItems}
        head={displayItem ?? undefined}
        headDisplayBody={headDisplayBody}
        headPostTime={headPostTime}
        statusLabel={statusLabel}
        isSpeaking={isSpeaking}
        paused={paused}
        playing={playing}
        hasStoredQueue={hasStoredQueue}
        queuePreview={queuePreview}
        rate={rate}
        languageLabel={languageLabel}
        backgroundTrackLabel={backgroundTrackLabel}
        playbackLanguage={playbackLanguage}
        playbackVoiceURI={playbackVoiceURI}
        voiceLanguage={voiceLanguage}
        compatibleVoices={compatibleVoices}
        selectedVoiceLabel={selectedVoiceLabel}
        backgroundTrack={backgroundTrack}
        autoAdvance={autoAdvance}
        autoListen={autoListen}
        playbackMode={playbackMode}
        linguetaOpen={linguetaOpen}
        linguetaAnchorRef={linguetaAnchorRef}
        languages={PLAYBACK_LANGUAGES}
        backgroundTracks={BACKGROUND_TRACKS}
        onPlay={() => void play()}
        onStop={() => void stop()}
        onSkipPost={() => void skipPost()}
        onSkipProfile={() => void skipProfile()}
        onPlayGeneral={() => void playGeneralPosts()}
        onToggleLingueta={() => setLinguetaOpen((v) => !v)}
        onCloseLingueta={() => setLinguetaOpen(false)}
        onRateChange={setRate}
        onLanguageChange={(next) => {
          if (isPlaybackLanguage(next)) setPlaybackLanguage(next);
        }}
        onVoiceChange={setPlaybackVoiceURI}
        onBackgroundChange={(next) => {
          if (isBackgroundTrack(next)) setBackgroundTrack(next);
        }}
        onAutoAdvanceChange={setAutoAdvance}
        onAutoListenChange={setAutoListen}
        isPlaybackLanguage={isPlaybackLanguage}
        isBackgroundTrack={isBackgroundTrack}
      />
    );
  }

  return (
    <div
      ref={playerRef}
      style={isEmbedded ? undefined : playerStyle}
      className={cn(
        "floating-listen-player flex flex-col text-foreground backdrop-blur-xl",
        isEmbedded
          ? "relative z-0 flex h-full min-h-0 w-full min-w-0 flex-col overflow-visible rounded-xl border border-white/10 bg-[#03070d]/95 shadow-none"
          : cn(
              "fixed z-[60] overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[#03070d]/95 shadow-[0_24px_80px_hsl(var(--primary)/0.16)]",
              !playerSize && (defaultPlacement === "feed-top" ? "min-h-[238px]" : "w-[min(420px,calc(100vw-2rem))]"),
              !position && "bottom-4 right-4",
            ),
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),linear-gradient(180deg,hsl(var(--primary)/0.05),transparent_42%)]" />
      {!isEmbedded &&
        [
          { edge: "n" as const, className: "left-5 right-5 top-0 h-2 cursor-ns-resize" },
        { edge: "s" as const, className: "bottom-0 left-5 right-5 h-2 cursor-ns-resize" },
        { edge: "e" as const, className: "bottom-5 right-0 top-5 w-2 cursor-ew-resize" },
        { edge: "w" as const, className: "bottom-5 left-0 top-5 w-2 cursor-ew-resize" },
        { edge: "ne" as const, className: "right-0 top-0 h-5 w-5 cursor-nesw-resize" },
        { edge: "nw" as const, className: "left-0 top-0 h-5 w-5 cursor-nwse-resize" },
        { edge: "se" as const, className: "bottom-0 right-0 h-5 w-5 cursor-nwse-resize" },
        { edge: "sw" as const, className: "bottom-0 left-0 h-5 w-5 cursor-nesw-resize" },
      ].map((handle) => (
        <div
          key={handle.edge}
          className={cn("absolute z-20 touch-none select-none", handle.className)}
          onPointerDown={(event) => startResize(handle.edge, event)}
          onPointerMove={(event) => {
            if (resizeRef.current?.pointerId !== event.pointerId) return;
            resizeTo(event.clientX, event.clientY);
          }}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
          aria-hidden="true"
          />
        ))}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-between gap-2 border-b border-white/10",
          isEmbedded ? "px-0.5 py-1.5" : "gap-3 px-4 py-3",
          !isEmbedded && "touch-none cursor-move select-none",
        )}
        {...(isEmbedded
          ? {}
          : {
              onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
                const rect = playerRef.current?.getBoundingClientRect();
                if (!rect) return;
                dragRef.current = {
                  pointerId: event.pointerId,
                  offsetX: event.clientX - rect.left,
                  offsetY: event.clientY - rect.top,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              },
              onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
                if (dragRef.current?.pointerId !== event.pointerId) return;
                moveTo(event.clientX, event.clientY);
              },
              onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
                if (dragRef.current?.pointerId === event.pointerId) {
                  dragRef.current = null;
                }
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              },
              onPointerCancel: () => {
                dragRef.current = null;
              },
            })}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10",
              isEmbedded ? "h-7 w-7" : "h-10 w-10 shadow-[0_0_22px_hsl(var(--primary)/0.35)]",
            )}
          >
            <Sparkles className={cn("text-primary", isEmbedded ? "h-3.5 w-3.5" : "h-5 w-5")} />
          </div>
          <div className="min-w-0">
            <p className={cn("truncate font-semibold tracking-wide", isEmbedded ? "text-[11px]" : "text-sm")}>
              Audio queue
            </p>
            <p className={cn("text-muted-foreground", isEmbedded ? "text-[10px]" : "text-xs")}>
              {waitingCount ? `${waitingCount} waiting` : "All caught up"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full border border-white/10 bg-white/5 hover:bg-white/10",
              isEmbedded ? "h-6 px-2 text-[10px]" : "h-8 px-3 text-xs",
            )}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Less" : "More"}
          </Button>
          {onClose && !isEmbedded ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/10"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
              aria-label="Hide audiopost player"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col",
          isEmbedded
            ? cn("min-h-0 gap-1.5 px-0.5 py-1", expanded || foldExpanded ? "flex-1 overflow-y-auto" : "overflow-hidden")
            : "gap-4 overflow-y-auto px-4 py-4",
        )}
      >
        <div className={cn("flex items-start gap-1.5", isEmbedded ? "text-[10px]" : "text-sm")}>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wide",
              isEmbedded ? "text-[9px]" : "mt-1 px-2 py-1 text-[10px]",
              isSpeaking ? "bg-primary/15 text-primary" : paused ? "bg-amber-400/10 text-amber-300" : "bg-white/5 text-muted-foreground",
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", isSpeaking ? "animate-pulse bg-primary" : "bg-muted-foreground")} />
            {statusLabel}
          </span>
          <p
            className={cn(
              "flex-1 text-muted-foreground",
              isEmbedded ? "line-clamp-1 text-[10px] leading-4" : "line-clamp-2 text-xs leading-5",
            )}
          >
            {displayItem ? (
              <>
                <span className="font-medium text-foreground">@{displayItem.authorUsername ?? "creator"}</span>
                {headPostTime ? <span> · {headPostTime}</span> : null}
                {" — "}
                {headDisplayBody || "No text content."}
              </>
            ) : (
              "Timeline is live. New posts will play automatically when Auto Listen is on."
            )}
          </p>
        </div>

        <div className={cn("shrink-0", isEmbedded ? "" : "min-h-[3.25rem]")}>
          <VoiceWaveform active={isSpeaking} dense={embeddedDense} />
        </div>

        {playbackHint ? (
          <p className="shrink-0 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
            {playbackHint}
          </p>
        ) : null}

        <div className={cn("shrink-0", isEmbedded ? "space-y-0.5" : "space-y-1")}>
          <div className={cn("overflow-hidden rounded-full bg-white/10", isEmbedded ? "h-0.5" : "h-1")}>
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all",
                isSpeaking ? "w-1/2" : paused ? "w-1/3" : "w-1/5",
                !isEmbedded && "shadow-[0_0_16px_hsl(var(--primary))]",
              )}
            />
          </div>
          <div className={cn("flex justify-between text-muted-foreground", isEmbedded ? "text-[9px]" : "text-[10px]")}>
            <span>{isSpeaking ? "Live reading" : paused ? "Paused" : "Standby"}</span>
            <span>{queuedCount} queued</span>
          </div>
        </div>

        {isEmbedded ? (
          <div className="mt-auto shrink-0 space-y-1.5 border-t border-white/10 pt-2">
            <div className="flex flex-wrap items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 rounded-full border border-white/10 bg-white/5 px-2 text-[9px] hover:bg-white/10"
                onClick={() => setExpanded((value) => !value)}
              >
                {rate.toFixed(1)}x
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 rounded-full border border-white/10 bg-white/5 px-2 text-[9px] hover:bg-white/10"
                onClick={() => setExpanded(true)}
                title="Choose reading language"
              >
                {languageLabel}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 rounded-full border border-white/10 bg-white/5 px-2 text-[9px] hover:bg-white/10"
                onClick={() => setExpanded(true)}
                title="Choose background sound"
              >
                BG: {backgroundTrackLabel}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-0.5 px-0.5 py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => void skipProfile()}
                disabled={!hasStoredQueue}
                aria-label="Skip profile"
              >
                <UserRoundX className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => void skipPost()}
                disabled={!hasStoredQueue}
                aria-label="Skip post"
              >
                <SkipBack className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="mx-0.5 h-9 w-9 shrink-0 rounded-full border-2 border-primary/60 bg-primary text-primary-foreground transition active:scale-95"
                onClick={() => void play()}
                aria-label={isSpeaking ? "Pause" : paused ? "Resume" : "Play"}
              >
                {isSpeaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => void skipPost()}
                disabled={!hasStoredQueue}
                aria-label="Next post"
              >
                <SkipForward className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => void stop()}
                disabled={!playing && !paused}
                aria-label="Stop"
              >
                <Square className="h-3 w-3" />
              </Button>
            </div>

            {expanded ? (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[10px]">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">Playback options</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[9px]"
                    onClick={() => setExpanded(false)}
                  >
                    Less
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-muted-foreground">Read in</Label>
                    <span className="font-mono text-foreground">{languageLabel}</span>
                  </div>
                  <select
                    value={playbackLanguage}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (isPlaybackLanguage(next)) setPlaybackLanguage(next);
                    }}
                    className="h-7 w-full rounded-md border border-white/10 bg-background/80 px-2 text-[10px]"
                  >
                    {PLAYBACK_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-muted-foreground">Speed</Label>
                    <span className="font-mono">{rate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={2}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="h-1 w-full accent-primary"
                  />
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <input type="checkbox" className="h-3 w-3" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
                    Auto-advance
                  </label>
                  <label className="flex items-center gap-1.5 text-muted-foreground">
                    <input type="checkbox" className="h-3 w-3" checked={autoListen} onChange={(e) => setAutoListen(e.target.checked)} />
                    Auto-listen
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs hover:bg-white/10"
            onClick={() => setExpanded((value) => !value)}
          >
            {rate.toFixed(1)}x
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs hover:bg-white/10"
            onClick={() => setExpanded(true)}
            title="Choose reading language"
          >
            {languageLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-xs hover:bg-white/10"
            onClick={() => setExpanded(true)}
            title="Choose background sound"
          >
            BG: {backgroundTrackLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => void skipProfile()}
            disabled={!hasStoredQueue}
            aria-label="Skip profile"
          >
            <UserRoundX className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => void skipPost()}
            disabled={!hasStoredQueue}
            aria-label="Skip post"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="h-16 w-16 rounded-full border border-primary/60 bg-primary text-primary-foreground shadow-[0_0_34px_hsl(var(--primary)/0.55)] transition active:scale-95"
            onClick={() => void play()}
            aria-label={isSpeaking ? "Pause" : paused ? "Resume" : "Play"}
          >
            {isSpeaking ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 fill-current" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => void skipPost()}
            disabled={!hasStoredQueue}
            aria-label="Next post"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            onClick={() => void stop()}
            disabled={!playing && !paused}
            aria-label="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            disabled
            aria-label="Volume controls coming soon"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
        )}

        {!embeddedDense ? (
          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-xs sm:grid-cols-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-none gap-2 text-muted-foreground hover:bg-white/10"
              onClick={() => void skipProfile()}
              disabled={!hasStoredQueue}
            >
              <UserRoundX className="h-4 w-4" />
              Skip Profile
            </Button>
            <Button
              type="button"
              variant={playbackMode === "general" ? "secondary" : "ghost"}
              className="h-11 rounded-none gap-2"
              onClick={() => void playGeneralPosts()}
            >
              <ListOrdered className="h-4 w-4" />
              Timeline
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-none gap-2 text-muted-foreground hover:bg-white/10"
              onClick={() => void skipPost()}
              disabled={!hasStoredQueue}
            >
              <SkipForward className="h-4 w-4" />
              Skip Post
            </Button>
          </div>
        ) : null}

        {!embeddedDense ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Up Next
            </p>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setProfilesOpen((open) => !open)}>
              View Queue
              {profilesOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {queuePreview.length ? (
              queuePreview.map((item) => (
                <div key={item.queueId} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="truncate text-xs font-medium text-foreground">Post from @{item.authorUsername ?? "creator"}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatPostTime(item.createdAt) ?? "Queued"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground sm:col-span-3">
                No posts waiting. Timeline is watching for new posts.
              </div>
            )}
          </div>
        </div>
        ) : null}

        {!embeddedDense && profilesOpen ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Followed profiles</p>
              <span className="text-[10px] text-muted-foreground">{followedProfiles.length} active</span>
            </div>
            {followedProfiles.length ? (
              <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {followedProfiles.map((profile, index) => (
                  <div key={profile.id} className="flex items-center justify-between gap-2 rounded-xl bg-background/50 px-3 py-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {index + 1}. {profile.displayName}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        @{profile.username} · {profile.kind === "external_x" ? "X" : "EchonX"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                      disabled={profileBusyId === profile.id}
                      onClick={() => void removeFollowedProfile(profile.id)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No followed profiles yet.</p>
            )}
            {profileError ? <p className="text-xs text-destructive">{profileError}</p> : null}
          </div>
        ) : null}

        {expanded && !embeddedDense ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-foreground">Playback options</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Collapse
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs text-muted-foreground">Read in</Label>
                <span className="text-xs font-mono text-foreground">{languageLabel}</span>
              </div>
              <select
                value={playbackLanguage}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isPlaybackLanguage(next)) setPlaybackLanguage(next);
                }}
                className="h-9 w-full rounded-md border border-white/10 bg-background/80 px-3 text-xs text-foreground outline-none ring-primary/30 focus:ring-2"
              >
                {PLAYBACK_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] leading-4 text-muted-foreground">
                Use Português (BR) to prioritize Brazilian voices.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs text-muted-foreground">Voice</Label>
                <span className="max-w-[55%] truncate text-xs font-mono text-foreground">{selectedVoiceLabel}</span>
              </div>
              <select
                value={playbackVoiceURI}
                onChange={(event) => setPlaybackVoiceURI(event.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-background/80 px-3 text-xs text-foreground outline-none ring-primary/30 focus:ring-2"
              >
                <option value="auto">Auto - best available for {voiceLanguage}</option>
                {compatibleVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <p className="text-[10px] leading-4 text-muted-foreground">
                Available voices depend on your browser and Windows voice packs. Natural or neural voices will appear here when installed.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs text-muted-foreground">Background sound</Label>
                <span className="text-xs font-mono text-foreground">{backgroundTrackLabel}</span>
              </div>
              <select
                value={backgroundTrack}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isBackgroundTrack(next)) setBackgroundTrack(next);
                }}
                className="h-9 w-full rounded-md border border-white/10 bg-background/80 px-3 text-xs text-foreground outline-none ring-primary/30 focus:ring-2"
              >
                {BACKGROUND_TRACKS.map((track) => (
                  <option key={track.value} value={track.value}>
                    {track.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] leading-4 text-muted-foreground">
                Soft generated ambience. It starts only while reading and stops on pause, stop, or skip.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-muted-foreground">Speed</Label>
              <span className="text-xs font-mono text-foreground">{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={autoAdvance} onChange={(e) => setAutoAdvance(e.target.checked)} />
              Auto-advance the queue when each post finishes
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={autoListen} onChange={(e) => setAutoListen(e.target.checked)} />
              Start reading automatically when new posts arrive
            </label>
            <p className="text-[10px] text-muted-foreground">
              Mode:{" "}
              {playbackMode === "general"
                ? "Timeline (posts from the last 6 hours)"
                : playbackMode === "profile"
                  ? "Current profile posts"
                  : "Skipping selected profiles"}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
