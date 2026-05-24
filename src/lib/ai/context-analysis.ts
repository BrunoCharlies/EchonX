import "server-only";

import { AI_OBSERVATION_MAX_CHARS } from "@/lib/ai/verification-limits";
import { normalizeConfidence, type ContextAnalysisResult } from "@/lib/ai/context-analysis-shared";

export type { ContextAnalysisResult, ContextConfidenceLevel } from "@/lib/ai/context-analysis-shared";
export {
  CONTEXT_CONFIDENCE_LABELS,
  AI_CONTEXT_FUTURE_CAPABILITIES,
  type AiContextFutureCapability,
  normalizeConfidence,
} from "@/lib/ai/context-analysis-shared";

export const AI_CONTEXT_ANALYSIS_SYSTEM_PROMPT = `You are an AI contextual analysis engine for social content.

Your role is NOT to determine absolute truth.

Your role is to:
- analyze contextual reliability
- detect possible inconsistencies
- identify bias or ambiguity
- provide concise informational insight

IMPORTANT RULES:
- Never claim something is false unless the provided text clearly contradicts itself.
- Never state that information is unverified as a hard conclusion.
- If certainty is low, say the information appears plausible but lacks sufficient context for confirmation.
- Avoid authoritative or accusatory language.
- Be neutral, concise, and analytical.
- Do NOT hallucinate external facts.
- Assume you do NOT have internet access.
- Keep the insight under 200 characters.
- Sound intelligent, subtle, and professional.

Respond with JSON only, no markdown:
{"confidence":"high"|"moderate"|"limited","insight":"your analysis here"}

confidence guide:
- high: internally consistent, clear claims, no major ambiguity in the text itself
- moderate: plausible but incomplete, mild bias or missing context
- limited: vague, speculative, or insufficient text for strong contextual read`;

export function parseContextAnalysisResponse(raw: string): ContextAnalysisResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        confidence?: string;
        insight?: string;
      };
      const confidence = normalizeConfidence(parsed.confidence);
      const insight = clampInsight(String(parsed.insight ?? ""));
      if (insight) {
        return { confidence, insight };
      }
    } catch {
      /* fall through */
    }
  }

  return {
    confidence: "moderate",
    insight: clampInsight(trimmed.replace(/^```json\s*|\s*```$/g, "")),
  };
}

function clampInsight(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= AI_OBSERVATION_MAX_CHARS) return normalized;
  return `${normalized.slice(0, AI_OBSERVATION_MAX_CHARS - 1).trim()}…`;
}
