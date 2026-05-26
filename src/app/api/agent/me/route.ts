import { NextResponse } from "next/server";
import { getAgentXOAuthCredentials } from "@/lib/agent/config";
import { getAgentUsersMe } from "@/lib/agent/x-client";

export const runtime = "nodejs";

/**
 * Temporary helper: resolve AGENT_X_USER_ID for @echonagent OAuth tokens only.
 * Does NOT use X_BEARER_TOKEN (import/sync account).
 *
 * TEMP: no auth — internal validation only. Re-enable admin/CRON_SECRET before production.
 * Remove this route after AGENT_X_USER_ID is set in Vercel.
 */
export async function GET() {
  const creds = getAgentXOAuthCredentials();
  if (!creds) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing agent OAuth env: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET.",
      },
      { status: 503 },
    );
  }

  try {
    const x = await getAgentUsersMe(creds);
    const data = x.data as { id?: string; username?: string; name?: string } | undefined;

    return NextResponse.json({
      ok: true,
      note: "Agent OAuth only (@echonagent). Import/sync X_BEARER_TOKEN is not used here.",
      hint: data?.id
        ? {
            agent_x_user_id: data.id,
            username: data.username,
            name: data.name,
            vercel_env: `AGENT_X_USER_ID=${data.id}`,
          }
        : null,
      x,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "users_me_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
