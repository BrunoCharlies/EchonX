import "server-only";

/** OAuth 1.0a user context for @echonagent — separate from X_BEARER_TOKEN (import/sync). */
export type AgentXOAuthCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
};

export type AgentXCredentials = AgentXOAuthCredentials & {
  userId: string;
};

export function getAgentXOAuthCredentials(): AgentXOAuthCredentials | null {
  const apiKey =
    process.env.X_API_KEY?.trim() ||
    process.env.X_CONSUMER_KEY?.trim() ||
    process.env.TWITTER_API_KEY?.trim() ||
    "";
  const apiSecret =
    process.env.X_API_SECRET?.trim() ||
    process.env.X_CONSUMER_SECRET?.trim() ||
    process.env.TWITTER_API_SECRET?.trim() ||
    "";
  const accessToken =
    process.env.X_ACCESS_TOKEN?.trim() ||
    process.env.TWITTER_ACCESS_TOKEN?.trim() ||
    "";
  const accessSecret =
    process.env.X_ACCESS_SECRET?.trim() ||
    process.env.X_ACCESS_TOKEN_SECRET?.trim() ||
    process.env.TWITTER_ACCESS_TOKEN_SECRET?.trim() ||
    "";

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return null;
  }
  return { apiKey, apiSecret, accessToken, accessSecret };
}

export function getAgentXCredentials(): AgentXCredentials | null {
  const oauth = getAgentXOAuthCredentials();
  if (!oauth) return null;
  const userId =
    process.env.AGENT_X_USER_ID?.trim() ||
    process.env.X_AGENT_USER_ID?.trim() ||
    "";
  if (!userId) return null;
  return { ...oauth, userId };
}

export function isOpenAiAgentConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function isAgentCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  return bearer === secret;
}
