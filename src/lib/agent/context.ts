import "server-only";

import { AIGARTH_PUBLIC_FRAMING, ECHONX_OFFICIAL_X_MENTION } from "@/lib/agent/brand";
import { loadAgentPlaybook } from "@/lib/agent/playbook";
import { AI_ANALYSIS_PLAN } from "@/lib/billing/ai-plans";
import { LIBRARY_PLANS } from "@/lib/billing/library-plans";
import { libraryPlanPriceLabel } from "@/lib/billing/library-plans";
import { PLANS, planPriceLabel } from "@/lib/plans";

/** Compact product context for prompts (plans, features, positioning). */
export async function getAgentContext(): Promise<string> {
  const audiopostPlans = PLANS.map(
    (p) => `- ${p.name} (${p.id}): ${planPriceLabel(p)} — ${p.description}`,
  ).join("\n");

  const libraryPlans = LIBRARY_PLANS.map(
    (p) => `- ${p.name}: ${libraryPlanPriceLabel(p)} — ${p.description}`,
  ).join("\n");

  return [
    `EchonX is a profile-first social listening platform (echonx.app). Official X account: ${ECHONX_OFFICIAL_X_MENTION}.`,
    "No infinite feed — users follow profiles and listen to posts as audio (Audiopost).",
    "Native EchonX profiles: unlimited listening. External X profiles: plan limits apply.",
    "Core value: calm, intelligent, audio-first consumption; signal over noise; less doomscrolling.",
    "",
    "Audiopost plans:",
    audiopostPlans,
    "",
    "Library Premium (Fish voice for long-form listening):",
    libraryPlans,
    "",
    `EchonX AI Context Analysis: ${AI_ANALYSIS_PLAN.name} at $${AI_ANALYSIS_PLAN.priceUsd}/mo — optional GPT-powered post context on native posts.`,
    "",
    "Key features: Want to Hear (follow X profiles), listening queue, Library (books/PDFs), Explore, native profiles, optional AI verification on posts.",
    "Billing: Stripe subscriptions at /app/settings/billing.",
    "Support: support@echonx.app",
    "",
    AIGARTH_PUBLIC_FRAMING,
    playbook
      ? [
          "",
          "--- Official agent playbook (positioning, Qubic education, Aigarth roadmap, transparency) ---",
          playbook,
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
