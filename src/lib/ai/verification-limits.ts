export const AI_VERIFICATION_FREE_DAILY = 3;
export const AI_VERIFICATION_PREMIUM_DAILY = 30;
export const AI_OBSERVATION_MAX_CHARS = 220;

export type AiVerificationPlan = "free" | "ai-analysis";

export function dailyLimitForPlan(plan: AiVerificationPlan): number {
  return plan === "ai-analysis" ? AI_VERIFICATION_PREMIUM_DAILY : AI_VERIFICATION_FREE_DAILY;
}

export function startOfUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}
