"use server";

import {
  loadListeningPlanUsage,
  type ListeningPlanUsage,
  type ListeningPlanUsageResult,
} from "@/lib/billing/load-listening-usage";

export type { ListeningPlanUsage, ListeningPlanUsageResult };

export async function getListeningPlanUsage(): Promise<ListeningPlanUsage | null> {
  const result = await loadListeningPlanUsage();
  return result.ok ? result.usage : null;
}
