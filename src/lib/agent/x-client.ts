import "server-only";

import crypto from "crypto";
import type { AgentXCredentials, AgentXOAuthCredentials } from "@/lib/agent/config";

const TWEETS_URL = "https://api.twitter.com/2/tweets";

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** OAuth 1.0a base URL (no query) + query params for the signature parameter string. */
function splitOAuthUrl(url: string): { baseUrl: string; queryParams: Record<string, string> } {
  const parsed = new URL(url);
  const queryParams: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });
  parsed.search = "";
  return { baseUrl: parsed.toString(), queryParams };
}

function oauth1Authorization(
  method: string,
  url: string,
  creds: AgentXOAuthCredentials,
  extraParams: Record<string, string> = {},
): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
    ...extraParams,
  };

  const paramString = Object.keys(oauth)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(oauth[key] ?? "")}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessSecret)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauth.oauth_signature = signature;

  const header =
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(oauth[key] ?? "")}"`)
      .join(", ");

  return header;
}

async function xOAuthJson<T>(
  creds: AgentXOAuthCredentials,
  method: "POST",
  body: Record<string, unknown>,
): Promise<T> {
  const authorization = oauth1Authorization(method, TWEETS_URL, creds);
  const res = await fetch(TWEETS_URL, {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as T & { detail?: string; title?: string };
  if (!res.ok) {
    const detail =
      typeof json === "object" && json && "detail" in json
        ? String(json.detail)
        : JSON.stringify(json).slice(0, 400);
    throw new Error(`X API ${method} failed (${res.status}): ${detail}`);
  }
  return json;
}

async function xOAuthGet<T>(creds: AgentXOAuthCredentials, path: string): Promise<T> {
  const url = `https://api.twitter.com/2${path}`;
  const { baseUrl, queryParams } = splitOAuthUrl(url);
  const authorization = oauth1Authorization("GET", baseUrl, creds, queryParams);
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: authorization },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as T & { detail?: string };
  if (!res.ok) {
    throw new Error(`X API GET failed (${res.status}): ${JSON.stringify(json).slice(0, 400)}`);
  }
  return json;
}

/** Authenticated user for the agent OAuth tokens (GET /2/users/me). */
export async function getAgentUsersMe(
  creds: AgentXOAuthCredentials,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    "user.fields": "id,name,username,created_at,description,profile_image_url,verified",
  });
  const json = await xOAuthGet<Record<string, unknown>>(
    creds,
    `/users/me?${params.toString()}`,
  );
  return json;
}

export async function createAgentPost(creds: AgentXCredentials, text: string): Promise<string> {
  const trimmed = text.trim().slice(0, 280);
  if (!trimmed) throw new Error("Post text is empty.");

  const json = await xOAuthJson<{ data?: { id: string } }>(creds, "POST", { text: trimmed });
  const id = json.data?.id;
  if (!id) throw new Error("X API did not return a tweet id.");
  return id;
}

export async function replyToPost(
  creds: AgentXCredentials,
  inReplyToTweetId: string,
  text: string,
): Promise<string> {
  const trimmed = text.trim().slice(0, 280);
  if (!trimmed) throw new Error("Reply text is empty.");

  const json = await xOAuthJson<{ data?: { id: string } }>(creds, "POST", {
    text: trimmed,
    reply: { in_reply_to_tweet_id: inReplyToTweetId },
  });
  const id = json.data?.id;
  if (!id) throw new Error("X API did not return a reply tweet id.");
  return id;
}

export type XMention = {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
};

export async function getMentions(
  creds: AgentXCredentials,
  sinceId?: string | null,
): Promise<XMention[]> {
  const params = new URLSearchParams({
    "tweet.fields": "author_id,created_at,text",
    expansions: "author_id",
    "user.fields": "username",
    max_results: "20",
  });
  if (sinceId?.trim()) params.set("since_id", sinceId.trim());

  const json = await xOAuthGet<{
    data?: { id: string; text: string; author_id?: string }[];
    includes?: { users?: { id: string; username: string }[] };
  }>(creds, `/users/${creds.userId}/mentions?${params.toString()}`);

  const users = new Map(
    (json.includes?.users ?? []).map((u) => [u.id, u.username] as const),
  );

  return (json.data ?? []).map((tweet) => ({
    id: tweet.id,
    text: tweet.text ?? "",
    authorId: tweet.author_id ?? "",
    authorUsername: users.get(tweet.author_id ?? "") ?? "unknown",
  }));
}
