import "server-only";

import { getAgentContext } from "@/lib/agent/context";
import { getAgentXCredentials, isOpenAiAgentConfigured } from "@/lib/agent/config";
import {
  getLastMentionSinceId,
  isAgentEnabled,
  loadRecentMemoryText,
  saveAgentMemory,
  setLastMentionSinceId,
} from "@/lib/agent/memory";
import { generateMentionReply } from "@/lib/agent/openai";
import { classifyMentionHeuristic } from "@/lib/agent/prompts";
import { getMentions, replyToPost } from "@/lib/agent/x-client";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type MentionCycleResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  fetched?: number;
  replied?: number;
  errors?: string[];
};

export async function runMentionReplyCycle(): Promise<MentionCycleResult> {
  if (!(await isAgentEnabled())) {
    return { ok: true, skipped: true, reason: "agent_disabled" };
  }
  if (!isOpenAiAgentConfigured()) {
    return { ok: false, reason: "openai_not_configured" };
  }

  const creds = getAgentXCredentials();
  if (!creds) {
    return { ok: false, reason: "x_credentials_missing" };
  }

  const sinceId = await getLastMentionSinceId();
  const mentions = await getMentions(creds, sinceId);

  if (mentions.length === 0) {
    return { ok: true, fetched: 0, replied: 0 };
  }

  const supabase = createServiceRoleClient();
  const platformContext = await getAgentContext();
  const recentMemory = await loadRecentMemoryText();
  const errors: string[] = [];
  let replied = 0;
  let newestId = sinceId;

  for (const mention of mentions) {
    if (!newestId || mention.id > newestId) newestId = mention.id;

    const { data: existing } = await supabase
      .from("agent_mentions")
      .select("id, replied")
      .eq("x_mention_id", mention.id)
      .maybeSingle();

    if (existing?.replied === true) continue;

    const mentionType = classifyMentionHeuristic(mention.text);

    let rowId = existing?.id as string | undefined;
    if (!rowId) {
      const { data: saved, error: saveError } = await supabase
        .from("agent_mentions")
        .insert({
          x_mention_id: mention.id,
          username: mention.authorUsername,
          content: mention.text,
          mention_type: mentionType,
          replied: false,
        })
        .select("id")
        .single();

      if (saveError || !saved?.id) {
        errors.push(saveError?.message ?? "save_mention_failed");
        continue;
      }
      rowId = saved.id as string;
    }

    try {
      const replyText = await generateMentionReply({
        mentionType,
        mentionText: mention.text,
        authorUsername: mention.authorUsername,
        platformContext,
        recentMemory,
      });

      const replyPostId = await replyToPost(creds, mention.id, replyText);

      await supabase
        .from("agent_mentions")
        .update({
          replied: true,
          reply_post_id: replyPostId,
          reply_content: replyText,
        })
        .eq("id", rowId);

      await saveAgentMemory("mention_reply", `@${mention.authorUsername}: ${replyText.slice(0, 180)}`);
      replied += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "reply_failed";
      errors.push(message);
      await supabase
        .from("agent_mentions")
        .update({ error_message: message })
        .eq("id", rowId);
    }
  }

  if (newestId) await setLastMentionSinceId(newestId);

  return {
    ok: errors.length === 0,
    fetched: mentions.length,
    replied,
    errors: errors.length ? errors : undefined,
  };
}
