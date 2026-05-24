import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONTEXT_CONFIDENCE_LABELS,
  normalizeConfidence,
  type ContextConfidenceLevel,
} from "@/lib/ai/context-analysis-shared";
import { hashPostContent } from "@/lib/ai/post-content-hash";
import { analyzePostContextWithOpenAi } from "@/lib/ai/openai-verify";
import {
  aiFreeLimitExceeded,
  aiVerificationRemaining,
  loadAiEntitlement,
  type AiEntitlement,
} from "@/lib/billing/ai-entitlements";

export type ContextAnalysisSuccess = {
  insight: string;
  /** @deprecated Use insight */
  observation: string;
  confidence: ContextConfidenceLevel;
  confidenceLabel: string;
  cacheHit: boolean;
  plan: AiEntitlement["plan"];
  dailyLimit: number;
  /** Billable OpenAI calls used today (not cache reads). */
  dailyUsed: number;
  remaining: number;
};

export type VerifyPostSuccess = ContextAnalysisSuccess;

export type VerifyPostErrorCode = "daily_limit" | "not_found" | "openai_unconfigured" | "openai_failed";

export class VerifyPostError extends Error {
  constructor(
    message: string,
    readonly code: VerifyPostErrorCode,
    readonly redirectUrl?: string,
  ) {
    super(message);
    this.name = "VerifyPostError";
  }
}

type PostRow = {
  id: string;
  body: string;
  image_paths: string[] | null;
  external_source: string | null;
};

type CachedRow = {
  observation: string;
  content_hash: string;
  confidence_level: string | null;
};

function successPayload(
  entitlement: AiEntitlement,
  insight: string,
  confidence: ContextConfidenceLevel,
  cacheHit: boolean,
): ContextAnalysisSuccess {
  return {
    insight,
    observation: insight,
    confidence,
    confidenceLabel: CONTEXT_CONFIDENCE_LABELS[confidence],
    cacheHit,
    plan: entitlement.plan,
    dailyLimit: entitlement.dailyLimit,
    dailyUsed: entitlement.dailyUsed,
    remaining: aiVerificationRemaining(entitlement),
  };
}

export async function runPostContextAnalysis(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
): Promise<ContextAnalysisSuccess> {
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, body, image_paths, external_source")
    .eq("id", postId)
    .maybeSingle();

  if (postErr || !post) {
    throw new VerifyPostError("Post not found.", "not_found");
  }

  const row = post as PostRow;
  const imagePaths = (row.image_paths as string[] | null) ?? [];
  const contentHash = hashPostContent(row.body, imagePaths);

  const { data: cached } = await supabase
    .from("post_verifications")
    .select("observation, content_hash, confidence_level")
    .eq("post_id", postId)
    .maybeSingle();

  const entitlement = await loadAiEntitlement(supabase, userId);
  const cachedRow = cached as CachedRow | null;

  if (cachedRow && cachedRow.content_hash === contentHash) {
    await logAnalysis(supabase, {
      userId,
      postId,
      tokensEstimated: 0,
      cacheHit: true,
    });
    const confidence = normalizeConfidence(cachedRow.confidence_level);
    return successPayload(entitlement, cachedRow.observation, confidence, true);
  }

  if (entitlement.dailyUsed >= entitlement.dailyLimit) {
    const redirectUrl =
      entitlement.plan === "free" ? "/pricing#ai-plan" : "/app/settings/billing#ai-plan";
    throw new VerifyPostError(
      "Daily context analysis limit reached.",
      "daily_limit",
      redirectUrl,
    );
  }

  let aiResult;
  try {
    aiResult = await analyzePostContextWithOpenAi({
      body: row.body,
      externalSource: row.external_source,
      hasImages: imagePaths.length > 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Context analysis failed.";
    if (message.includes("not configured")) {
      throw new VerifyPostError(message, "openai_unconfigured");
    }
    throw new VerifyPostError(message, "openai_failed");
  }

  const now = new Date().toISOString();
  const { error: upsertErr } = await supabase.from("post_verifications").upsert(
    {
      post_id: postId,
      content_hash: contentHash,
      observation: aiResult.insight,
      confidence_level: aiResult.confidence,
      model: aiResult.model,
      tokens_used: aiResult.tokensEstimated,
      updated_at: now,
    },
    { onConflict: "post_id" },
  );

  if (upsertErr) {
    console.error("[ai-context] cache upsert failed", upsertErr.message);
  }

  await logAnalysis(supabase, {
    userId,
    postId,
    tokensEstimated: aiResult.tokensEstimated,
    cacheHit: false,
  });

  const afterOpenAi: AiEntitlement = {
    ...entitlement,
    dailyUsed: entitlement.dailyUsed + 1,
  };

  return successPayload(afterOpenAi, aiResult.insight, aiResult.confidence, false);
}

/** @deprecated Use runPostContextAnalysis */
export const runPostVerification = runPostContextAnalysis;

async function logAnalysis(
  supabase: SupabaseClient,
  input: { userId: string; postId: string; tokensEstimated: number; cacheHit: boolean },
) {
  const { error } = await supabase.from("ai_verification_logs").insert({
    user_id: input.userId,
    post_id: input.postId,
    tokens_estimated: input.tokensEstimated,
    cache_hit: input.cacheHit,
  });
  if (error) {
    console.error("[ai-context] log insert failed", error.message);
  }
}

export { aiFreeLimitExceeded };
