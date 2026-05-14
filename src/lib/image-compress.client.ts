"use client";

import imageCompression from "browser-image-compression";

const MAX_BYTES = 2 * 1024 * 1024;

const baseOptions = {
  maxSizeMB: 1.9,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  initialQuality: 0.82,
};

export async function compressImageForUpload(file: File) {
  const webpOptions = { ...baseOptions, fileType: "image/webp" } as Parameters<typeof imageCompression>[1] & {
    fileType?: string;
  };

  let compressed = await imageCompression(file, webpOptions);
  if (compressed.size > MAX_BYTES) {
    compressed = await imageCompression(file, { ...webpOptions, maxSizeMB: 1.2, initialQuality: 0.72 });
  }
  if (compressed.size > MAX_BYTES) {
    compressed = await imageCompression(file, { ...webpOptions, maxSizeMB: 0.8, initialQuality: 0.58 });
  }
  return compressed;
}
