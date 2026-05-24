import { librarySourceProxyUrl } from "@/lib/library/library-source-url";

export function isLibraryDocumentProxyUrl(url: string) {
  try {
    const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://echonx.app");
    return parsed.pathname === "/api/recommended-reading/document";
  } catch {
    return url.startsWith("/api/recommended-reading/document");
  }
}

/** Same-origin proxy that returns plain text extracted from a recommended PDF on the server. */
export function libraryPdfTextProxyUrl(remoteDocumentUrl: string) {
  const base = librarySourceProxyUrl(remoteDocumentUrl);
  return `${base}${base.includes("?") ? "&" : "?"}extract=text`;
}
