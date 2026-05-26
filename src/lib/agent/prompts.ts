import { ECHONX_OFFICIAL_X_MENTION } from "@/lib/agent/brand";
import { AUTONOMOUS_POST_TOPICS, ECHONX_AGENT_SYSTEM_PROMPT } from "@/lib/agent/personality";

export type MentionType =
  | "support"
  | "philosophy"
  | "feature"
  | "product"
  | "casual"
  | "unknown";

export function buildAutonomousPostUserPrompt(input: {
  topic: string;
  platformContext: string;
  recentMemory: string;
}): string {
  return [
    `Write one original post for X (Twitter). Max 260 characters.`,
    `Topic angle: ${input.topic}`,
    `Allowed topic themes: ${AUTONOMOUS_POST_TOPICS.join(", ")}`,
    "",
    "Platform context (use only if naturally relevant):",
    input.platformContext,
    "",
    input.recentMemory ? `Recent agent memory:\n${input.recentMemory}` : null,
    "",
    "Output only the post text. No quotes, no hashtags unless essential, no thread marker.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildMentionReplyUserPrompt(input: {
  mentionType: MentionType;
  mentionText: string;
  authorUsername: string;
  platformContext: string;
  recentMemory: string;
}): string {
  return [
    `Reply to this X mention from @${input.authorUsername}. Max 260 characters.`,
    `Mention type: ${input.mentionType}`,
    `Mention text:\n${input.mentionText}`,
    "",
    "Platform context:",
    input.platformContext,
    "",
    input.recentMemory ? `Recent memory:\n${input.recentMemory}` : null,
    "",
    `Be helpful if they ask about EchonX. When discussing the EchonX system or product, mention the official account ${ECHONX_OFFICIAL_X_MENTION} when natural and within 260 characters. Stay calm and human. Output only the reply text.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function classifyMentionHeuristic(text: string): MentionType {
  const lower = text.toLowerCase();
  if (/price|plan|billing|subscribe|cost|how much|free tier/i.test(lower)) return "product";
  if (/feature|library|audiopost|listen|voice|ai context|how do i|how does/i.test(lower)) return "feature";
  if (/help|bug|broken|error|support|not working/i.test(lower)) return "support";
  if (/doomscroll|philosophy|why|vision|future|attention|signal|noise/i.test(lower)) return "philosophy";
  if (/hi|hello|hey|thanks|thank you|cool|nice/i.test(lower)) return "casual";
  return "unknown";
}

export { ECHONX_AGENT_SYSTEM_PROMPT };
