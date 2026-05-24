export type PostImageDimension = { width: number; height: number };

/** Posts mirrored or synced from X (not native EchonX uploads or News curator cards). */
export function isXImportedPost(
  externalSource: string | null | undefined,
  authorKind?: string | null,
): boolean {
  if (authorKind === "external_x") return true;
  if (!externalSource) return false;
  return externalSource === "x" || externalSource === "qubic_x";
}

export function parseXImageDimensions(
  moderationPayload: unknown,
  imageIndex = 0,
): PostImageDimension | null {
  if (!moderationPayload || typeof moderationPayload !== "object") return null;
  const dims = (moderationPayload as Record<string, unknown>).xImageDimensions;
  if (!Array.isArray(dims)) return null;
  const item = dims[imageIndex];
  if (!item || typeof item !== "object") return null;
  const width = (item as { width?: unknown }).width;
  const height = (item as { height?: unknown }).height;
  if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}
