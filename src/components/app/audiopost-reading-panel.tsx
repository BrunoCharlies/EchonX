"use client";

import { useState } from "react";
import { PdfReadingPlayer, type PdfReadingSource } from "@/components/app/pdf-reading-player";
import { RecommendedReadingLibrary } from "@/components/app/recommended-reading-library";
import { XProfileListeningForm } from "@/components/app/x-profile-listening-form";
import type { RecommendedReadingItem } from "@/server/actions/recommended-reading";

export function AudiopostReadingPanel({ fixedRecommendation }: { fixedRecommendation: RecommendedReadingItem | null }) {
  const [selectedSource, setSelectedSource] = useState<PdfReadingSource | null>(null);

  return (
    <div className="space-y-4">
      <RecommendedReadingLibrary
        fixedRecommendation={fixedRecommendation}
        selectedSourceId={selectedSource?.id}
        onSelect={setSelectedSource}
      />
      <PdfReadingPlayer selectedSource={selectedSource} />
      <XProfileListeningForm />
    </div>
  );
}
