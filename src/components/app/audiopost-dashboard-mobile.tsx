"use client";

import { useRef } from "react";
import { useAudiopostLibrary } from "@/contexts/audiopost-library-context";
import { AudiopostLibrarySection } from "@/components/app/audiopost-library-section";
import { AudiopostNowPlayingShell } from "@/components/app/audiopost-now-playing-shell";
import { AudiopostPdfUploadPanel } from "@/components/app/audiopost-pdf-upload-panel";
import { AudiopostXProfilesPanel } from "@/components/app/audiopost-x-profiles-panel";
import { LibraryBottomBar } from "@/components/app/library-bottom-bar";
import { PdfReadingPlayer, type PdfReadingPlayerHandle } from "@/components/app/pdf-reading-player";
import type { RecommendedReadingItem } from "@/server/actions/recommended-reading";
import { AUDIOPOST_BOTTOM_BAR_MOBILE_RESERVED_PX } from "@/components/app/audiopost-bottom-bar-layout";

const SCROLL_END_PADDING = `calc(${AUDIOPOST_BOTTOM_BAR_MOBILE_RESERVED_PX}px + env(safe-area-inset-bottom, 0px))`;

/** Simplified Audiopost for viewports &lt; 1024px — see docs HTML §46. */
export function AudiopostDashboardMobile({
  fixedRecommendation,
}: {
  fixedRecommendation: RecommendedReadingItem | null;
}) {
  const pdfRef = useRef<PdfReadingPlayerHandle>(null);
  const { selectedSource, setPlayback } = useAudiopostLibrary();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#050a12] lg:hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(0,200,255,0.09),transparent_55%)]"
        aria-hidden
      />

      <div
        className="relative z-10 flex flex-col gap-4 p-3 max-sm:gap-3 max-sm:p-2"
        style={{ paddingBottom: SCROLL_END_PADDING }}
      >
        <section className="shrink-0">
          <AudiopostNowPlayingShell />
        </section>

        <section className="shrink-0">
          <AudiopostXProfilesPanel />
        </section>

        <section className="shrink-0">
          <AudiopostLibrarySection fixedRecommendation={fixedRecommendation} />
        </section>

        <section className="shrink-0 scroll-mt-3" aria-label="Upload PDF">
          <AudiopostPdfUploadPanel
            layout="stack"
            onFileSelected={(file) => {
              void pdfRef.current?.loadFile(file);
            }}
          />
        </section>
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
