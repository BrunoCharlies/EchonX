const MAX_POST_BODY_CHARS = 500;

/** Visible post body for mirrored X tweets (link kept for UI; stripped from audio). */
export function buildQubicMirrorPostBody(input: { text: string; xUsername: string; statusUrl: string }) {
  const text = input.text.replace(/\s+/g, " ").trim().slice(0, 380);
  const handle = input.xUsername.replace(/^@/, "");
  const lines = [text, "", `From X: @${handle}`, input.statusUrl.trim()].filter(Boolean);
  let body = lines.join("\n").trim();

  if (body.length > MAX_POST_BODY_CHARS) {
    const prefix = `${text.slice(0, Math.max(80, MAX_POST_BODY_CHARS - 80)).trim()}…`;
    body = `${prefix}\n\nFrom X: @${handle}\n${input.statusUrl}`.slice(0, MAX_POST_BODY_CHARS);
  }

  return body;
}
