import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLibraryEntitlement } from "@/lib/billing/library-entitlements";
import { libraryUtf8ByteLength } from "@/lib/billing/library-quota-policy";
import { formatSupabaseError } from "@/lib/billing/supabase-error";
import type { LibraryEntitlement } from "@/lib/billing/library-entitlements";

export type LibraryQuotaCheckResult =
  | { ok: true; entitlement: LibraryEntitlement; byteLength: number }
  | { ok: false; code: "LIBRARY_QUOTA_EXHAUSTED" | "LIBRARY_PLAN_INACTIVE"; entitlement: LibraryEntitlement };

export async function checkLibraryFishQuota(
  supabase: SupabaseClient,
  ownerXUserId: string,
  text: string,
): Promise<LibraryQuotaCheckResult> {
  const entitlement = await loadLibraryEntitlement(supabase, ownerXUserId);
  const byteLength = libraryUtf8ByteLength(text);

  if (!entitlement.plan || !entitlement.fishActive) {
    if (entitlement.plan && entitlement.exhaustedAction) {
      return { ok: false, code: "LIBRARY_QUOTA_EXHAUSTED", entitlement };
    }
    return { ok: false, code: "LIBRARY_PLAN_INACTIVE", entitlement };
  }

  const remaining = entitlement.bytesRemaining ?? 0;
  if (byteLength > remaining) {
    return { ok: false, code: "LIBRARY_QUOTA_EXHAUSTED", entitlement };
  }

  return { ok: true, entitlement, byteLength };
}

export async function recordLibraryBytesConsumed(
  supabase: SupabaseClient,
  ownerXUserId: string,
  byteLength: number,
): Promise<number> {
  if (byteLength <= 0) return 0;

  const { data, error } = await supabase.rpc("increment_library_bytes_consumed", {
    p_owner_x_user_id: ownerXUserId,
    p_delta: byteLength,
  });

  if (error) {
    throw new Error(formatSupabaseError(error, "Could not record library voice usage."));
  }

  return Number(data ?? 0);
}
