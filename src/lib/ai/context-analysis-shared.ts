/** Shared types/labels — safe for client and server. */

export type ContextConfidenceLevel = "high" | "moderate" | "limited";

export type ContextAnalysisResult = {
  insight: string;
  confidence: ContextConfidenceLevel;
};

export const CONTEXT_CONFIDENCE_LABELS: Record<ContextConfidenceLevel, string> = {
  high: "High Context Confidence",
  moderate: "Moderate Context Confidence",
  limited: "Limited Context Confidence",
};

export const AI_CONTEXT_FUTURE_CAPABILITIES = [
  "deep_analysis",
  "source_trace",
  "bias_detection",
  "narrative_analysis",
  "contradiction_detection",
  "web_search_layer",
] as const;

export type AiContextFutureCapability = (typeof AI_CONTEXT_FUTURE_CAPABILITIES)[number];

export function normalizeConfidence(value: unknown): ContextConfidenceLevel {
  if (value === "high" || value === "moderate" || value === "limited") {
    return value;
  }
  const lower = String(value ?? "").toLowerCase();
  if (lower.includes("high")) return "high";
  if (lower.includes("limited") || lower.includes("low")) return "limited";
  return "moderate";
}
