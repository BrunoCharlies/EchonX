import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/service";

const RECENT_LIMIT = 12;

export async function getAgentSetting(key: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agent_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data?.value as string | undefined) ?? null;
}

export async function setAgentSetting(key: string, value: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("agent_settings").upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function isAgentEnabled(): Promise<boolean> {
  const envOff = process.env.AGENT_ENABLED === "false";
  if (envOff) return false;
  const envOn = process.env.AGENT_ENABLED === "true";
  const setting = await getAgentSetting("agent_enabled");
  if (envOn) return true;
  return setting === "true";
}

export async function loadRecentMemoryText(limit = RECENT_LIMIT): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("agent_memory")
    .select("category, content, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!data?.length) return "";
  return data
    .map((row) => `[${row.category}] ${String(row.content).slice(0, 200)}`)
    .join("\n");
}

export async function saveAgentMemory(category: string, content: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("agent_memory").insert({
    category,
    content: content.slice(0, 4000),
  });
  if (error) throw error;
}

export async function getLastMentionSinceId(): Promise<string | null> {
  const value = await getAgentSetting("last_mention_since_id");
  return value?.trim() || null;
}

export async function setLastMentionSinceId(id: string): Promise<void> {
  await setAgentSetting("last_mention_since_id", id);
}
