"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CONTEXT_CONFIDENCE_LABELS,
  type ContextConfidenceLevel,
} from "@/lib/ai/context-analysis-shared";
import { cn } from "@/lib/utils";

type Props = {
  postId: string;
  isAuthenticated: boolean;
  signInCallbackUrl?: string;
  className?: string;
};

type AnalysisResponse = {
  insight: string;
  observation?: string;
  confidence: ContextConfidenceLevel;
  confidenceLabel?: string;
  cacheHit?: boolean;
};

const CONFIDENCE_DOT: Record<ContextConfidenceLevel, string> = {
  high: "bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.45)]",
  moderate: "bg-amber-400/85 shadow-[0_0_8px_rgba(251,191,36,0.35)]",
  limited: "bg-muted-foreground/50",
};

/**
 * Contextual AI layer — not absolute verification. Isolated from browser translate (translate="no").
 */
export function PostContextAnalysis({
  postId,
  isAuthenticated,
  signInCallbackUrl = "/app/explore",
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ContextConfidenceLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleAnalyze() {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=${encodeURIComponent(signInCallbackUrl)}`);
      return;
    }

    if (insight) {
      setExpanded((open) => !open);
      return;
    }

    setLoading(true);
    setExpanded(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/verify-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = (await res.json()) as AnalysisResponse & {
        error?: string;
        code?: string;
        redirectUrl?: string;
      };

      if (res.status === 429 && data.code === "daily_limit") {
        setExpanded(false);
        router.push(data.redirectUrl ?? "/pricing#ai-plan");
        return;
      }

      if (!res.ok) {
        setExpanded(false);
        setError(data.error ?? "Could not analyze context for this post.");
        return;
      }

      setInsight(data.insight ?? data.observation ?? "");
      setConfidence(data.confidence ?? "moderate");
      setExpanded(true);
    } catch {
      setExpanded(false);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const confidenceLabel =
    confidence ? CONTEXT_CONFIDENCE_LABELS[confidence] : null;
  const showPanel = expanded && (loading || insight);

  return (
    <div
      className={cn("notranslate mt-2", className)}
      translate="no"
      lang="en"
      suppressHydrationWarning
    >
      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={loading}
        aria-busy={loading}
        aria-expanded={Boolean(showPanel)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground disabled:opacity-80 dark:border-white/[0.08] dark:bg-white/[0.02]",
          loading && "border-primary/25 shadow-[0_0_12px_rgba(0,255,255,0.12)]",
        )}
      >
        <span
          className={cn(
            "relative flex h-3 w-3 shrink-0 items-center justify-center",
            loading && "animate-pulse",
          )}
          aria-hidden
        >
          <Sparkles
            className={cn(
              "h-3 w-3 text-primary/80 transition-opacity",
              loading && "text-primary",
            )}
          />
        </span>
        <span>AI Context</span>
      </button>

      <p
        className={cn("mt-1.5 text-[11px] text-destructive/90", !error && "hidden")}
        role="alert"
      >
        {error ?? ""}
      </p>

      <div
        className={cn(
          "mt-2 overflow-hidden rounded-lg border border-border/35 bg-gradient-to-br from-muted/20 via-transparent to-primary/[0.03] dark:border-white/[0.06] dark:from-white/[0.03] dark:to-primary/[0.04]",
          !showPanel && "hidden",
        )}
        role="status"
        aria-live="polite"
      >
        {loading ? (
          <div className="space-y-2.5 p-3">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-primary/70">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Analyzing context…
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-[92%] rounded bg-gradient-to-r from-muted/30 via-primary/15 to-muted/30 bg-[length:200%_100%] animate-ai-context-shimmer" />
              <div className="h-2.5 w-[78%] rounded bg-gradient-to-r from-muted/30 via-primary/10 to-muted/30 bg-[length:200%_100%] animate-ai-context-shimmer [animation-delay:120ms]" />
              <div className="h-2.5 w-[65%] rounded bg-gradient-to-r from-muted/30 via-primary/10 to-muted/30 bg-[length:200%_100%] animate-ai-context-shimmer [animation-delay:240ms]" />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-1 p-3 duration-300">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/75">
                EchonX · Context Analysis
              </span>
              {confidence && confidenceLabel ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", CONFIDENCE_DOT[confidence])}
                    aria-hidden
                  />
                  {confidenceLabel}
                </span>
              ) : null}
            </div>
            <p className="text-[12px] leading-relaxed text-muted-foreground">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use PostContextAnalysis */
export const PostVerifyButton = PostContextAnalysis;
