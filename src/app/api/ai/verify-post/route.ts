import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOpenAiConfigured } from "@/lib/ai/openai-verify";
import { runPostVerification, VerifyPostError } from "@/lib/ai/run-post-verification";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      { error: "AI context analysis is not configured.", code: "openai_unconfigured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const postId = (body as { postId?: string }).postId?.trim();
  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    const result = await runPostVerification(supabase, session.user.id, postId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VerifyPostError) {
      if (err.code === "daily_limit") {
        return NextResponse.json(
          {
            error: err.message,
            code: err.code,
            redirectUrl: err.redirectUrl ?? "/pricing#ai-plan",
          },
          { status: 429 },
        );
      }
      if (err.code === "not_found") {
        return NextResponse.json({ error: err.message, code: err.code }, { status: 404 });
      }
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code === "openai_unconfigured" ? 503 : 502 },
      );
    }

    const message = err instanceof Error ? err.message : "Context analysis failed.";
    console.error("[ai/verify-post]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
