import "server-only";

import { getOpenAiApiKey } from "@/lib/env";
import {
  ECHONX_AGENT_SYSTEM_PROMPT,
  buildAutonomousPostUserPrompt,
  buildMentionReplyUserPrompt,
  type MentionType,
} from "@/lib/agent/prompts";
import { AUTONOMOUS_POST_TOPICS } from "@/lib/agent/personality";

const MODEL = "gpt-4.1-mini";

function pickTopic(): string {
  const idx = Math.floor(Math.random() * AUTONOMOUS_POST_TOPICS.length);
  return AUTONOMOUS_POST_TOPICS[idx] ?? "signal over noise";
}

async function chatCompletion(userPrompt: string): Promise<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 120,
      messages: [
        { role: "system", content: ECHONX_AGENT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned empty content.");
  return text.replace(/^["']|["']$/g, "").slice(0, 280);
}

export async function generateAutonomousPost(input: {
  platformContext: string;
  recentMemory: string;
  topic?: string;
}): Promise<string> {
  const topic = input.topic ?? pickTopic();
  const prompt = buildAutonomousPostUserPrompt({
    topic,
    platformContext: input.platformContext,
    recentMemory: input.recentMemory,
  });
  return chatCompletion(prompt);
}

export async function generateMentionReply(input: {
  mentionType: MentionType;
  mentionText: string;
  authorUsername: string;
  platformContext: string;
  recentMemory: string;
}): Promise<string> {
  const prompt = buildMentionReplyUserPrompt(input);
  return chatCompletion(prompt);
}
