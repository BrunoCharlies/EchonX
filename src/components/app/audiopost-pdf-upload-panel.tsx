"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { audiopostCardClass, audiopostCardPadding, audiopostSectionLabelClass } from "@/components/app/audiopost-premium";
import {
  addRecentPdf,
  clearRecentPdfs,
  formatPdfAgo,
  loadRecentPdfs,
  type RecentPdfEntry,
} from "@/lib/audiopost/recent-pdf-history";
import { cn } from "@/lib/utils";

export function AudiopostPdfUploadPanel({ onFileSelected }: { onFileSelected: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<RecentPdfEntry[]>([]);

  useEffect(() => {
    setRecent(loadRecentPdfs());
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setRecent(addRecentPdf(file));
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const hasHistory = recent.length > 0;

  return (
    <div className={cn(audiopostCardClass(), audiopostCardPadding, "flex h-full min-h-0 flex-col")}>
      <p className={cn(audiopostSectionLabelClass, "shrink-0 text-muted-foreground")}>Upload PDF</p>

      <div
        className="mt-2 flex h-[100px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,255,255,0.25)] bg-primary/[0.04] px-3 text-center"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file?.type === "application/pdf" || file?.name.endsWith(".pdf")) handleFile(file);
        }}
      >
        <CloudUpload className="h-6 w-6 text-primary" />
        <p className="mt-1 text-[11px] text-muted-foreground">Quick drop zone</p>
        <Button
          type="button"
          size="sm"
          className="mt-2 h-9 w-full rounded-xl text-xs"
          onClick={() => inputRef.current?.click()}
        >
          Choose PDF
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent uploads</p>
        <div className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
          {hasHistory ? (
            <ul className="space-y-1">
              {recent.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium">{file.name}</p>
                    <p className="text-[9px] text-muted-foreground">{formatPdfAgo(file.addedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-center text-[10px] text-muted-foreground">No PDFs uploaded yet this session.</p>
          )}
        </div>
      </div>

      <div className="mt-2 shrink-0 border-t border-white/[0.06] pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full rounded-xl text-xs"
          disabled={!hasHistory}
          onClick={() => setRecent(clearRecentPdfs())}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
