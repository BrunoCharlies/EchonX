/** Parse checkout API responses without masking server errors as "Network error". */
export async function parseCheckoutResponse(
  res: Response,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return {
      ok: false,
      error: res.ok ? "Empty response from server." : `Request failed (${res.status}).`,
    };
  }

  let data: { url?: string; error?: string };
  try {
    data = JSON.parse(text) as { url?: string; error?: string };
  } catch {
    return {
      ok: false,
      error: res.ok
        ? "Invalid server response. Try again or contact support."
        : `Request failed (${res.status}). Try again.`,
    };
  }

  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? "Could not start checkout." };
  }

  return { ok: true, url: data.url };
}
