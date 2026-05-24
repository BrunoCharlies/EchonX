import {
  NEWS_OFFICIAL_OWNER_KEY,
  NEWS_OFFICIAL_USERNAME,
  QUBIC_OFFICIAL_OWNER_KEY,
  QUBIC_OFFICIAL_USERNAME,
  QUBIC_X_USERNAME,
} from "@/lib/curator/constants";

function isQubicXMirrorUsername(username: string | null | undefined) {
  const normalized = (username ?? "").toLowerCase();
  return normalized === `x_${QUBIC_X_USERNAME}` || normalized === `x_${QUBIC_OFFICIAL_USERNAME}`;
}

export function isQubicOfficialProfile(input: {
  owner_x_user_id?: string | null;
  username?: string | null;
}) {
  return (
    input.owner_x_user_id === QUBIC_OFFICIAL_OWNER_KEY ||
    (input.username ?? "").toLowerCase() === QUBIC_OFFICIAL_USERNAME ||
    isQubicXMirrorUsername(input.username)
  );
}

export function isNewsOfficialProfile(input: {
  owner_x_user_id?: string | null;
  username?: string | null;
}) {
  return (
    input.owner_x_user_id === NEWS_OFFICIAL_OWNER_KEY ||
    (input.username ?? "").toLowerCase() === NEWS_OFFICIAL_USERNAME
  );
}

/** Official channels that never count toward paid external X profile slots. */
export function isFreeOfficialFollowProfile(input: {
  owner_x_user_id?: string | null;
  username?: string | null;
  kind?: string | null;
}) {
  if (input.kind === "curator" && (isQubicOfficialProfile(input) || isNewsOfficialProfile(input))) {
    return true;
  }
  return isQubicOfficialProfile(input);
}

export function isReservedQubicXHandle(handle: string) {
  return handle.toLowerCase() === QUBIC_X_USERNAME;
}

export function officialChannelBadgeLabel(input: {
  owner_x_user_id?: string | null;
  username?: string | null;
}) {
  if (isQubicOfficialProfile(input)) return "Qubic";
  if (isNewsOfficialProfile(input)) return "News";
  return "Official";
}
