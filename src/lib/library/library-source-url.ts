/**
 * Same-origin proxy for library documents (Gutenberg .txt + Supabase PDF).
 * Avoids iOS Safari CORS / worker fetch issues on recommended PDFs.
 */
export function librarySourceProxyUrl(remoteUrl: string) {
  return `/api/recommended-reading/document?url=${encodeURIComponent(remoteUrl)}`;
}
