import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

const PLAYBOOK_RELATIVE = path.join("content", "agent", "playbook.md");
/** Keeps prompts within reasonable size if the playbook grows. */
const MAX_PLAYBOOK_CHARS = 14_000;

let cachedPlaybook: string | null = null;

/** Official positioning / education (Markdown). Empty if file missing. */
export function loadAgentPlaybook(): string {
  if (cachedPlaybook !== null) return cachedPlaybook;

  try {
    const filePath = path.join(process.cwd(), PLAYBOOK_RELATIVE);
    const raw = readFileSync(filePath, "utf8").trim();
    if (!raw) {
      cachedPlaybook = "";
      return cachedPlaybook;
    }
    cachedPlaybook =
      raw.length > MAX_PLAYBOOK_CHARS
        ? `${raw.slice(0, MAX_PLAYBOOK_CHARS)}\n\n[playbook truncated for prompt size]`
        : raw;
  } catch {
    cachedPlaybook = "";
  }

  return cachedPlaybook;
}
