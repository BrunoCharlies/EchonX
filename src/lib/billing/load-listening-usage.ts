import { auth } from "@/auth";
import {
  countExternalXListeningProfiles,
  loadUserEntitlement,
  type UserEntitlement,
} from "@/lib/billing/entitlements";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import { externalXLimitLabel } from "@/lib/plans";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ListeningPlanUsage = {
  entitlement: UserEntitlement;
  externalXCount: number;
  limitLabel: string;
};

export type ListeningPlanUsageResult =
  | { ok: true; usage: ListeningPlanUsage }
  | { ok: false; error: string };

/** Server-only loader for settings/billing pages (not a Server Action). */
export async function loadListeningPlanUsage(): Promise<ListeningPlanUsageResult> {
  const session = await auth();
  const listenerId = session?.user?.id ?? null;
  if (!listenerId) {
    return { ok: false, error: "Sign in to view your plan." };
  }

  try {
    const supabase = createServiceRoleClient();
    const entitlement = await loadUserEntitlement(supabase, listenerId);
    const externalXCount = await countExternalXListeningProfiles(supabase, listenerId);

    return {
      ok: true,
      usage: {
        entitlement,
        externalXCount,
        limitLabel: externalXLimitLabel(entitlement.effectivePlan),
      },
    };
  } catch (error) {
    const message = formatSupabaseError(
      error,
      "Could not load billing data. Check SUPABASE_SERVICE_ROLE_KEY and that migrations are applied.",
    );
    console.error("[loadListeningPlanUsage]", error);
    return { ok: false, error: message };
  }
}
