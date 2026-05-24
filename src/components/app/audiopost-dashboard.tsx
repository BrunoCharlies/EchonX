"use client";

import { useRef } from "react";
import { AudiopostLibraryProvider, useAudiopostLibrary } from "@/contexts/audiopost-library-context";
import { AudiopostListeningMapCard } from "@/components/app/audiopost-listening-map-card";
import { AudiopostLibrarySection } from "@/components/app/audiopost-library-section";
import { AudiopostNowPlayingShell } from "@/components/app/audiopost-now-playing-shell";
import { AudiopostPdfUploadPanel } from "@/components/app/audiopost-pdf-upload-panel";
import { AudiopostXProfilesPanel } from "@/components/app/audiopost-x-profiles-panel";
import { LibraryBottomBar } from "@/components/app/library-bottom-bar";
import { PdfReadingPlayer, type PdfReadingPlayerHandle } from "@/components/app/pdf-reading-player";
import type { RecommendedReadingItem } from "@/server/actions/recommended-reading";
import { cn } from "@/lib/utils";
import { AUDIOPOST_BOTTOM_BAR_RESERVED_PX } from "@/components/app/audiopost-bottom-bar-layout";

const DASHBOARD_HEIGHT = `calc(100dvh - 4rem - ${AUDIOPOST_BOTTOM_BAR_RESERVED_PX}px)`;

const cellClass = "flex min-h-0 min-w-0 flex-col";

function AudiopostDashboardInner({ fixedRecommendation }: { fixedRecommendation: RecommendedReadingItem | null }) {
  const pdfRef = useRef<PdfReadingPlayerHandle>(null);
  const libraryLinguetaRef = useRef<HTMLDivElement>(null);
  const { selectedSource, setPlayback } = useAudiopostLibrary();

  return (
    <div
      className="audiopost-dashboard relative flex min-h-0 flex-col overflow-hidden bg-[#050a12]"
      style={{ height: DASHBOARD_HEIGHT }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(0,200,255,0.09),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_100%,rgba(0,120,200,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:28px_28px]"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 grid min-h-0 flex-1 grid-cols-12 gap-4 overflow-hidden p-4",
          "lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]",
        )}
      >
        <div className={cn(cellClass, "row-start-1 col-span-12 lg:col-span-7 lg:row-start-1")}>
          <AudiopostNowPlayingShell linguetaAnchorRef={libraryLinguetaRef} />
        </div>

        <div className={cn(cellClass, "row-start-2 col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-1")}>
          <AudiopostListeningMapCard />
        </div>

        <div ref={libraryLinguetaRef} className={cn(cellClass, "relative isolate row-start-3 col-span-12 lg:col-span-6 lg:row-start-2")}>
          <AudiopostLibrarySection fixedRecommendation={fixedRecommendation} />
        </div>

        <div className={cn(cellClass, "row-start-4 col-span-12 lg:col-span-3 lg:col-start-7 lg:row-start-2")}>
          <AudiopostXProfilesPanel />
        </div>

        <div className={cn(cellClass, "row-start-5 col-span-12 lg:col-span-3 lg:col-start-10 lg:row-start-2")}>
          <AudiopostPdfUploadPanel
            onFileSelected={(file) => {
              void pdfRef.current?.loadFile(file);
            }}
          />
        </div>
      </div>

      <PdfReadingPlayer ref={pdfRef} headless selectedSource={selectedSource} onPlaybackUpdate={setPlayback} />

      <LibraryBottomBar
        onPlayPause={() => void pdfRef.current?.playPause()}
        onSkipBack={() => void pdfRef.current?.skipBack()}
        onSkipForward={() => void pdfRef.current?.skipForward()}
      />
    </div>
  );
}

export function AudiopostDashboard({
  fixedRecommendation,
}: {
  fixedRecommendation: RecommendedReadingItem | null;
}) {
  return (
    <AudiopostLibraryProvider>
      <AudiopostDashboardInner fixedRecommendation={fixedRecommendation} />
    </AudiopostLibraryProvider>
  );
}
