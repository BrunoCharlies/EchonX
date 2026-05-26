import "server-only";

import { getAgentContext } from "@/lib/agent/context";
import { getAgentXCredentials, isOpenAiAgentConfigured } from "@/lib/agent/config";
import { isAgentEnabled, loadRecentMemoryText, saveAgentMemory, setAgentSetting } from "@/lib/agent/memory";
import { generateAutonomousPost } from "@/lib/agent/openai";
import { createAgentPost } from "@/lib/agent/x-client";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type AutonomousPostResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  postId?: string;
  xPostId?: string;
  content?: string;
};

export async function runAutonomousPostCycle(): Promise<AutonomousPostResult> {
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

  const supabase = createServiceRoleClient();
  const platformContext = await getAgentContext();
  const recentMemory = await loadRecentMemoryText();

  const content = await generateAutonomousPost({ platformContext, recentMemory });

  const { data: row, error: insertError } = await supabase
    .from("agent_posts")
    .insert({ content, status: "draft", posted_to_x: false })
    .select("id")
    .single();

  if (insertError || !row?.id) {
    return { ok: false, reason: insertError?.message ?? "insert_failed" };
  }

  try {
    const xPostId = await createAgentPost(creds, content);
    await supabase
      .from("agent_posts")
      .update({
        posted_to_x: true,
        x_post_id: xPostId,
        status: "posted",
      })
      .eq("id", row.id);

    await saveAgentMemory("post", content);
    await setAgentSetting("last_autonomous_post_at", new Date().toISOString());

    return { ok: true, postId: row.id as string, xPostId, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "post_failed";
    await supabase
      .from("agent_posts")
      .update({ status: "failed", error_message: message })
      .eq("id", row.id);
    return { ok: false, reason: message, postId: row.id as string, content };
  }
}
