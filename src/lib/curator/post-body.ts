const MAX_POST_BODY_CHARS = 500;

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Builds the visible post body: short summary + source line (link kept for UI, stripped from audio). */
export function buildCuratorPostBody(input: { title: string; summary: string; link: string }) {
  const title = stripHtml(input.title).slice(0, 160);
  const summary = stripHtml(input.summary).slice(0, 260);
  const link = input.link.trim();

  const headline = summary || title;
  const lines = [headline, "", `Source: ${title}`, link].filter(Boolean);
  let body = lines.join("\n").trim();

  if (body.length > MAX_POST_BODY_CHARS) {
    const prefix = `${headline.slice(0, Math.max(80, MAX_POST_BODY_CHARS - 120)).trim()}…`;
    body = `${prefix}\n\nSource: ${title}\n${link}`.slice(0, MAX_POST_BODY_CHARS);
  }

  return body;
}
