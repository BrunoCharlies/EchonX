/** Profile photo / cover — user-facing rules (no vendor names in messages). */

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png"]);

export function isAllowedProfileImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime && ALLOWED_MIME.has(mime)) return true;
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  return ALLOWED_EXT.has(ext);
}

export const PROFILE_IMAGE_TYPE_MESSAGE =
  "Only JPEG or PNG images are accepted for your profile photo and cover. Please convert your file and try again.";

export const PROFILE_IMAGE_SIZE_MESSAGE = "Each image must be 2 MB or smaller after compression.";

export const PROFILE_IMAGE_MODERATION_MESSAGE =
  "This image did not pass our automatic safety review. Try a different photo.";

export const PROFILE_IMAGE_UPLOAD_MESSAGE = "We could not upload this image. Check the format (JPEG or PNG) and try again.";
