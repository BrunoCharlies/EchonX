import "server-only";

import { getOpenAiApiKey } from "@/lib/env";
import {
  AI_CONTEXT_ANALYSIS_SYSTEM_PROMPT,
  type ContextAnalysisResult,
  parseContextAnalysisResponse,
} from "@/lib/ai/context-analysis";

const MODEL = "gpt-4.1-mini";

export type OpenAiVerifyResult = ContextAnalysisResult & {
  tokensEstimated: number;
  model: string;
};

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

export async function analyzePostContextWithOpenAi(input: {
  body: string;
  externalSource?: string | null;
  hasImages: boolean;
}): Promise<OpenAiVerifyResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI is not configured on this server.");
  }

  const userContent = [
    `Analyze the following post for contextual reliability (not absolute fact-checking).`,
    `Post text:\n${input.body.slice(0, 2000)}`,
    input.hasImages ? "Note: post includes image(s); analyze text context only." : null,
    input.externalSource ? `Source tag: ${input.externalSource}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.25,
      max_tokens: 120,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: AI_CONTEXT_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!raw) {
    throw new Error("OpenAI returned an empty context analysis.");
  }

  const parsed = parseContextAnalysisResponse(raw);
  const tokensEstimated = json.usage?.total_tokens ?? Math.ceil((userContent.length + raw.length) / 4);

  return {
    ...parsed,
    tokensEstimated,
    model: MODEL,
  };
}

/** @deprecated Use analyzePostContextWithOpenAi */
export const verifyPostWithOpenAi = analyzePostContextWithOpenAi;
