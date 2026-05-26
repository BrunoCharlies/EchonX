import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgentXOAuthCredentials, isAgentCronAuthorized } from "@/lib/agent/config";
import { getAgentUsersMe } from "@/lib/agent/x-client";

export const runtime = "nodejs";

/**
 * Temporary helper: resolve AGENT_X_USER_ID for @echonagent OAuth tokens only.
 * Does NOT use X_BEARER_TOKEN (import/sync account).
 *
 * Auth: admin session or Authorization: Bearer CRON_SECRET
 * Remove this route after AGENT_X_USER_ID is set in Vercel.
 */
export async function GET(request: Request) {
  const session = await auth();
  const isAdmin = session?.user.role === "admin";
  if (!isAdmin && !isAgentCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

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
