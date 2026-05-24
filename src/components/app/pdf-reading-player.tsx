"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  useAudiopostLibraryOptional,
  type LibraryPlaybackSnapshot,
} from "@/contexts/audiopost-library-context";
import { FileText, Pause, Play, SkipBack, SkipForward, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  claimVoicePlayback,
  getSharedVoiceEngine,
  onVoicePlaybackSuperseded,
  releaseVoicePlayback,
  stopSharedVoicePlayback,
} from "@/lib/voice/voice-session";
import {
  getLibraryVoiceEngine,
  libraryQuotaErrorMessage,
} from "@/lib/voice/library-voice-session";
import { formatLibraryQuotaShort } from "@/lib/billing/library-quota-policy";
import type { VoiceEngine } from "@/lib/voice/voice-engine";
import { cn } from "@/lib/utils";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

/** Served from /public (see scripts/copy-pdf-worker.js) — do not use import.meta.url with Next/Webpack. */
function ensurePdfWorkerConfigured(pdfjs: typeof import("pdfjs-dist")) {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
}

type PdfSegment = {
  page: number;
  text: string;
};

export type PdfReadingSource = {
  id: string;
  title: string;
  author?: string | null;
  sourceType: "pdf" | "text";
  sourceUrl: string;
};

type ReaderState = "empty" | "loading" | "ready" | "playing" | "paused" | "finished";

function compactPdfText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function cleanPublicDomainText(text: string) {
  const startMatch = text.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i);
  const endMatch = text.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const bodyStart = startMatch ? (startMatch.index ?? 0) + startMatch[0].length : 0;
  const bodyEnd = endMatch ? (endMatch.index ?? text.length) : text.length;
  return compactPdfText(text.slice(bodyStart, bodyEnd));
}

function textToSegments(text: string): PdfSegment[] {
  const normalized = cleanPublicDomainText(text);
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [normalized];
  const segments: PdfSegment[] = [];
  let current = "";

  for (const sentence of sentences.map((item) => item.trim()).filter(Boolean)) {
    if ((current + " " + sentence).trim().length <= 1600) {
      current = (current + " " + sentence).trim();
      continue;
    }

    if (current) {
      segments.push({ page: segments.length + 1, text: current });
    }
    current = sentence;
  }

  if (current) {
    segments.push({ page: segments.length + 1, text: current });
  }

  return segments;
}

function detectSegmentLanguage(text: string) {
  const normalized = ` ${text.toLowerCase()} `;
  const portugueseScore =
    (/[ãõáàâêéíóôúç]/i.test(text) ? 3 : 0) +
    (normalized.match(/\b(que|não|para|com|uma|você|está|por|mais|como|foi|ser|ter|seu|sua)\b/g)?.length ?? 0);
  const spanishScore =
    (/[ñ¿¡]/i.test(text) ? 3 : 0) +
    (normalized.match(/\b(que|para|con|una|usted|está|por|más|como|fue|ser|tener|pero|los|las)\b/g)?.length ?? 0);
  const frenchScore =
    (/[àâçéèêëîïôûùüÿœ]/i.test(text) ? 3 : 0) +
    (normalized.match(/\b(que|pour|avec|une|vous|être|est|pas|plus|comme|dans|les|des|nous)\b/g)?.length ?? 0);

  const scores = [
    { lang: "pt-BR", score: portugueseScore },
    { lang: "es-ES", score: spanishScore },
    { lang: "fr-FR", score: frenchScore },
  ].sort((a, b) => b.score - a.score);

  return scores[0]?.score > 1 ? scores[0].lang : "en-US";
}

function isMobileAppleDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function extractPdfSegmentsFromBuffer(buffer: ArrayBuffer): Promise<PdfSegment[]> {
  const pdfjs = await import("pdfjs-dist");
  ensurePdfWorkerConfigured(pdfjs);

  const data = new Uint8Array(buffer);
  const mobileApple = isMobileAppleDevice();
  const documentTask = pdfjs.getDocument({
    data,
    /** Same-origin proxied PDFs + iOS Safari: avoid worker fetch to remote URLs. */
    useWorkerFetch: false,
    useSystemFonts: true,
    ...(mobileApple ? { useWasm: false } : {}),
  });
  const pdf = await documentTask.promise;
  const segments: PdfSegment[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = compactPdfText(
        textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" "),
      );

      if (text) {
        segments.push({ page: pageNumber, text });
      }
    }
  } finally {
    await pdf.destroy();
  }

  return segments;
}

async function extractPdfSegments(file: File): Promise<PdfSegment[]> {
  return extractPdfSegmentsFromBuffer(await file.arrayBuffer());
}

async function loadReadingSource(source: PdfReadingSource, signal?: AbortSignal) {
  const response = await fetch(source.sourceUrl, { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error("Unable to load the selected reading.");
  }

  if (source.sourceType === "pdf") {
    const buffer = await response.arrayBuffer();
    if (!buffer.byteLength) {
      throw new Error("The PDF file is empty.");
    }
    const segments = await extractPdfSegmentsFromBuffer(buffer);
    if (!segments.length) {
      throw new Error(
        "No readable text in this PDF. If this is a scan, try another title or open on desktop.",
      );
    }
    return segments;
  }

  const segments = textToSegments(await response.text());
  if (!segments.length) {
    throw new Error("No readable text was found in this book.");
  }
  return segments;
}

export type PdfReadingPlayerHandle = {
  playPause: () => Promise<void>;
  skipBack: () => Promise<void>;
  skipForward: () => Promise<void>;
  loadFile: (file: File) => Promise<void>;
};

export const PdfReadingPlayer = forwardRef<
  PdfReadingPlayerHandle,
  {
    selectedSource?: PdfReadingSource | null;
    headless?: boolean;
    onPlaybackUpdate?: (patch: Partial<LibraryPlaybackSnapshot>) => void;
  }
>(function PdfReadingPlayer({ selectedSource, headless = false, onPlaybackUpdate }, ref) {
  const libraryCtx = useAudiopostLibraryOptional();
  const libraryBarVolume = libraryCtx?.libraryBarVolume ?? 1;
  const libraryBarRate = libraryCtx?.libraryBarRate ?? 1;
  const libraryBarLanguage = libraryCtx?.libraryBarLanguage ?? "auto";
  const libraryBarVolumeRef = useRef(libraryBarVolume);
  const libraryBarRateRef = useRef(libraryBarRate);
  const libraryBarLanguageRef = useRef(libraryBarLanguage);
  libraryBarVolumeRef.current = libraryBarVolume;
  libraryBarRateRef.current = libraryBarRate;
  libraryBarLanguageRef.current = libraryBarLanguage;
  const [readerState, setReaderState] = useState<ReaderState>("empty");
  const [fileName, setFileName] = useState<string | null>(null);
  const [segments, setSegments] = useState<PdfSegment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<VoiceEngine | null>(null);
  const segmentsRef = useRef<PdfSegment[]>([]);
  const activeSourceIdRef = useRef<string | null>(null);
  const pendingPlayRef = useRef(false);
  const runIdRef = useRef(0);

  function setSegmentsState(next: PdfSegment[]) {
    segmentsRef.current = next;
    setSegments(next);
  }

  function libraryPlaybackPreview(
    status: Awaited<ReturnType<typeof getLibraryVoiceEngine>>["status"],
    segmentPreview: string | null,
  ) {
    if (status.fishActive && status.periodByteQuota > 0) {
      const remaining = status.bytesRemaining ?? 0;
      const pct = Math.round((remaining / status.periodByteQuota) * 100);
      return `Fish voice · ${formatLibraryQuotaShort(remaining)} left (${pct}%)`;
    }
    if (status.plan) {
      const hint = libraryQuotaErrorMessage(status);
      return hint ?? segmentPreview ?? "Browser voice (unlimited)";
    }
    return segmentPreview ?? "Browser voice (unlimited)";
  }

  async function getEngine() {
    if (libraryCtx) {
      const { engine, status } = await getLibraryVoiceEngine();
      engineRef.current = engine;
      await engine.warmUp();
      engine.setVolume(libraryBarVolumeRef.current);
      return { engine, status };
    }
    engineRef.current = await getSharedVoiceEngine();
    await engineRef.current.warmUp();
    return { engine: engineRef.current, status: null };
  }

  useEffect(() => {
    if (!libraryCtx) return;
    engineRef.current?.setVolume(libraryBarVolume);
  }, [libraryBarVolume, libraryCtx]);

  async function stopReading() {
    runIdRef.current += 1;
    pendingPlayRef.current = false;
    releaseVoicePlayback("pdf-reader");
    const activeEngine = engineRef.current;
    if (activeEngine) {
      await activeEngine.stop();
    }
    await stopSharedVoicePlayback();
  }

  async function startReading(index = currentIndex) {
    const sourceId = activeSourceIdRef.current;
    const segment = segmentsRef.current[index];
    if (!segment?.text?.trim() || !sourceId) {
      setError("Nothing to read in this section. Try another book or skip forward.");
      setReaderState("ready");
      onPlaybackUpdateRef.current?.({ error: "Nothing to read in this section.", readerState: "ready" });
      return;
    }

    await claimVoicePlayback("pdf-reader");
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setCurrentIndex(index);
    setReaderState("playing");
    setError(null);

    let voiceStatus: Awaited<ReturnType<typeof getLibraryVoiceEngine>>["status"] | null = null;
    try {
      const resolved = await getEngine();
      if (runId !== runIdRef.current || activeSourceIdRef.current !== sourceId) return;
      voiceStatus = resolved.status;
      const lang =
        libraryCtx && libraryBarLanguageRef.current !== "auto"
          ? libraryBarLanguageRef.current
          : detectSegmentLanguage(segment.text);

      onPlaybackUpdateRef.current?.({
        preview: voiceStatus
          ? libraryPlaybackPreview(voiceStatus, segment.text.slice(0, 80))
          : segment.text.slice(0, 80),
      });

      await resolved.engine.speak(segment.text, {
        lang,
        rate: libraryCtx ? libraryBarRateRef.current : 1,
        volume: libraryCtx ? libraryBarVolumeRef.current : 1,
      });
    } catch (err) {
      if (runId !== runIdRef.current || activeSourceIdRef.current !== sourceId) return;
      const message = err instanceof Error ? err.message : "Playback failed.";
      setError(message);
      setReaderState("ready");
      onPlaybackUpdateRef.current?.({ error: message });
      if (libraryCtx) void libraryCtx.refreshLibraryVoiceStatus();
      return;
    }

    if (libraryCtx) {
      const refreshed = await libraryCtx.refreshLibraryVoiceStatus();
      voiceStatus = refreshed;
      onPlaybackUpdateRef.current?.({
        preview: libraryPlaybackPreview(refreshed, segment.text.slice(0, 80)),
        error: libraryQuotaErrorMessage(refreshed),
      });
    }

    if (runId !== runIdRef.current || activeSourceIdRef.current !== sourceId) return;
    const nextIndex = index + 1;
    if (nextIndex < segmentsRef.current.length) {
      await startReading(nextIndex);
      return;
    }

    setReaderState("finished");
  }

  async function loadFile(file: File) {
    activeSourceIdRef.current = null;
    await stopReading();
    setError(null);
    setSegmentsState([]);
    setCurrentIndex(0);
    setFileName(file.name);
    setReaderState("loading");

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setReaderState("empty");
      setError("Please choose a valid PDF file.");
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setReaderState("empty");
      setError("This PDF is too large. Please use a file up to 10 MB.");
      return;
    }

    try {
      const extractedSegments = await extractPdfSegments(file);
      if (!extractedSegments.length) {
        setReaderState("empty");
        setError("No readable text was found. Scanned/image PDFs will need OCR in a future version.");
        return;
      }

      setSegmentsState(extractedSegments);
      setReaderState("ready");
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        await startReading(0);
      }
    } catch (err) {
      console.error(err);
      setReaderState("empty");
      setError("We could not read this PDF. Try another file with selectable text.");
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await loadFile(file);
  }

  async function onPlayPause() {
    if (readerState === "loading") {
      pendingPlayRef.current = true;
      onPlaybackUpdateRef.current?.({ preview: "Loading book…" });
      return;
    }

    if (!segmentsRef.current.length) return;

    if (readerState === "playing") {
      await engineRef.current?.pause();
      setReaderState("paused");
      return;
    }

    if (readerState === "paused") {
      await engineRef.current?.resume();
      setReaderState("playing");
      return;
    }

    await startReading(readerState === "finished" ? 0 : currentIndex);
  }

  async function onMove(offset: -1 | 1) {
    if (!segmentsRef.current.length || readerState === "loading") return;
    const nextIndex = Math.min(Math.max(currentIndex + offset, 0), segmentsRef.current.length - 1);
    if (nextIndex === currentIndex && readerState !== "playing") return;
    await startReading(nextIndex);
  }

  useImperativeHandle(
    ref,
    () => ({
      playPause: onPlayPause,
      skipBack: () => onMove(-1),
      skipForward: () => onMove(1),
      loadFile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- expose latest handlers to parent bar
    [segments.length, readerState, currentIndex],
  );

  const onPlaybackUpdateRef = useRef(onPlaybackUpdate);
  const lastPlaybackSyncRef = useRef("");
  onPlaybackUpdateRef.current = onPlaybackUpdate;

  useEffect(() => {
    return onVoicePlaybackSuperseded("pdf-reader", () => {
      runIdRef.current += 1;
      releaseVoicePlayback("pdf-reader");
      void stopSharedVoicePlayback();
      setReaderState((state) => (state === "playing" || state === "paused" ? "ready" : state));
    });
  }, []);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      releaseVoicePlayback("pdf-reader");
      void stopSharedVoicePlayback();
    };
  }, []);

  useEffect(() => {
    if (!selectedSource) {
      activeSourceIdRef.current = null;
      pendingPlayRef.current = false;
      return;
    }

    let alive = true;
    const source = selectedSource;
    const abortController = new AbortController();
    activeSourceIdRef.current = source.id;
    pendingPlayRef.current = false;

    async function loadSelectedSource() {
      await stopReading();
      if (!alive || activeSourceIdRef.current !== source.id) return;

      setError(null);
      setSegmentsState([]);
      setCurrentIndex(0);
      setFileName(source.title);
      setReaderState("loading");
      onPlaybackUpdateRef.current?.({
        title: source.title,
        author: source.author ?? null,
        preview: "Loading book…",
        error: null,
        readerState: "loading",
        canControl: false,
        currentIndex: 0,
        segmentCount: 0,
      });

      try {
        const nextSegments = await loadReadingSource(source, abortController.signal);
        if (!alive || activeSourceIdRef.current !== source.id) return;
        setSegmentsState(nextSegments);
        setReaderState("ready");
        onPlaybackUpdateRef.current?.({
          readerState: "ready",
          canControl: true,
          segmentCount: nextSegments.length,
          error: null,
        });
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          await startReading(0);
        }
      } catch (err) {
        if (!alive || activeSourceIdRef.current !== source.id) return;
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "We could not load this book. Pick another title or try again.";
        console.error(err);
        setReaderState("empty");
        setError(message);
        onPlaybackUpdateRef.current?.({
          readerState: "empty",
          canControl: false,
          error: message,
          preview: null,
        });
      }
    }

    void loadSelectedSource();

    return () => {
      alive = false;
      abortController.abort();
      void stopReading();
    };
    // The selected source id is the intentional reload boundary for this reader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource?.id]);

  const currentSegment = segments[currentIndex];
  const canControl = segments.length > 0 && readerState !== "loading";
  const isActive = readerState === "playing" || readerState === "paused";

  useEffect(() => {
    const patch = {
      title: selectedSource?.title ?? fileName ?? "Select a book",
      author: selectedSource?.author ?? null,
      preview: error ? null : (currentSegment?.text?.slice(0, 80) ?? null),
      error,
      readerState,
      canControl,
      currentIndex,
      segmentCount: segments.length,
    };
    const key = JSON.stringify(patch);
    if (lastPlaybackSyncRef.current === key) return;
    lastPlaybackSyncRef.current = key;
    onPlaybackUpdateRef.current?.(patch);
  }, [
    canControl,
    currentIndex,
    currentSegment?.text,
    error,
    fileName,
    readerState,
    segments.length,
    selectedSource?.author,
    selectedSource?.title,
  ]);

  if (headless) {
    return error ? (
      <p className="sr-only" role="alert">
        {error}
      </p>
    ) : null;
  }

  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="pdf-reader-upload" className="text-sm font-medium">
              Read a PDF aloud
            </Label>
            <p className="text-xs text-muted-foreground">Upload a local PDF and listen with the audio reader.</p>
          </div>
          <FileText className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label
            htmlFor="pdf-reader-upload"
            className={cn(
              "flex h-10 min-w-0 flex-1 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              readerState === "loading" && "pointer-events-none opacity-60",
            )}
          >
            <Upload className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !fileName && "text-muted-foreground")}>
              {readerState === "loading" ? "Extracting PDF text..." : fileName ?? "Choose a PDF file"}
            </span>
            <input
              id="pdf-reader-upload"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={readerState === "loading"}
              onChange={(event) => void onFileChange(event)}
            />
          </label>

          <div className="grid grid-cols-3 gap-2 sm:w-[150px]">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous PDF section"
              disabled={!canControl || currentIndex === 0}
              onClick={() => void onMove(-1)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              aria-label={readerState === "playing" ? "Pause PDF reading" : "Play PDF reading"}
              disabled={!canControl}
              className={cn(canControl && "shadow-lg shadow-primary/20")}
              onClick={() => void onPlayPause()}
            >
              {readerState === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next PDF section"
              disabled={!canControl || currentIndex >= segments.length - 1}
              onClick={() => void onMove(1)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {currentSegment ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Page {currentSegment.page} · Segment {currentIndex + 1} of {segments.length}
            </span>
            <span>{readerState === "finished" ? "Reading complete" : readerState === "paused" ? "Paused" : null}</span>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
});

PdfReadingPlayer.displayName = "PdfReadingPlayer";
