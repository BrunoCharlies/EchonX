/** EchonX AI Analysis — contextual reliability layer (not absolute fact-checking). */

export const AI_ANALYSIS_PLAN_ID = "ai-analysis" as const;

export type AiAnalysisPlanId = typeof AI_ANALYSIS_PLAN_ID;

export const AI_ANALYSIS_PLAN = {
  id: AI_ANALYSIS_PLAN_ID,
  name: "EchonX AI Analysis",
  priceUsd: 19,
  dailyAnalyses: 30,
  /** @deprecated Use dailyAnalyses */
  dailyVerifications: 30,
  description:
    "Contextual analysis, reliability signals, and discreet AI insight for posts.",
  features: [
    "30 context analyses per day",
    "Reliability signals (not verdicts)",
    "Shared cache for efficiency",
    "Discreet, premium UX",
  ],
  cta: "Start AI Analysis",
} as const;
