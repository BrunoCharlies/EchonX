/** Server-only detail for operators — never send `detail` to clients. */
export function logInternalError(scope: string, detail: unknown, publicCode?: string) {
  const message = detail instanceof Error ? detail.message : String(detail);
  console.error(`[${scope}]`, publicCode ? { code: publicCode, message } : message, detail);
}
