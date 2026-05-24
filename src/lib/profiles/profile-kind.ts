/**
 * Native auth profiles use `profiles.id` = auth.users.id and `owner_x_user_id` without the `x:` prefix.
 * External mirrors from X listening use `owner_x_user_id` = `x:{twitterUserId}` and username `x_{handle}`.
 */

export function isExternalOwnerKey(ownerXUserId: string | null | undefined): boolean {
  return typeof ownerXUserId === "string" && ownerXUserId.startsWith("x:");
}

/** True when this row belongs to a signed-in EchonX account (not an X mirror). */
export function isAuthLinkedNativeProfile(
  profile: { id: string; owner_x_user_id?: string | null; kind?: string | null },
  authUserId: string,
): boolean {
  if (profile.kind === "curator") return false;
  if (isExternalOwnerKey(profile.owner_x_user_id)) return false;
  return profile.id === authUserId || profile.owner_x_user_id === authUserId;
}

export function shouldDisplayAsNativeProfile(
  profile: { id: string; owner_x_user_id?: string | null; kind?: string | null },
  viewerAuthId?: string | null,
): boolean {
  if (profile.kind === "curator") return false;
  if (profile.kind === "native") return true;
  if (viewerAuthId && isAuthLinkedNativeProfile(profile, viewerAuthId)) return true;
  return !isExternalOwnerKey(profile.owner_x_user_id) && profile.kind !== "external_x";
}
