import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOpenAiConfigured } from "@/lib/ai/openai-verify";
import { runPostVerification, VerifyPostError } from "@/lib/ai/run-post-verification";
import { logInternalError } from "@/lib/errors/log-internal-error";
import {
  mapAiVerifyErrorCode,
  USER_FACING_ERROR_CODES,
  userFacingErrorResponse,
} from "@/lib/errors/user-facing";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(userFacingErrorResponse(USER_FACING_ERROR_CODES.EAUTH001), { status: 401 });
  }

  if (!isOpenAiConfigured()) {
    logInternalError("ai/verify-post", "OPENAI_API_KEY missing", USER_FACING_ERROR_CODES.EAI001);
    return NextResponse.json(userFacingErrorResponse(USER_FACING_ERROR_CODES.EAI001), { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(userFacingErrorResponse(USER_FACING_ERROR_CODES.EREQ001), { status: 400 });
  }

  const postId = (body as { postId?: string }).postId?.trim();
  if (!postId) {
    return NextResponse.json(userFacingErrorResponse(USER_FACING_ERROR_CODES.EREQ001), { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    const result = await runPostVerification(supabase, session.user.id, postId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VerifyPostError) {
      const publicCode = mapAiVerifyErrorCode(err.code);
      logInternalError("ai/verify-post", err, publicCode);

      if (err.code === "daily_limit") {
        return NextResponse.json(
          userFacingErrorResponse(publicCode, {
            redirectUrl: err.redirectUrl ?? "/pricing#ai-plan",
          }),
          { status: 429 },
        );
      }

      const status = err.code === "not_found" ? 404 : err.code === "openai_unconfigured" ? 503 : 502;
      return NextResponse.json(userFacingErrorResponse(publicCode), { status });
    }

    logInternalError("ai/verify-post", err, USER_FACING_ERROR_CODES.EGEN001);
    return NextResponse.json(userFacingErrorResponse(USER_FACING_ERROR_CODES.EGEN001), { status: 500 });
  }
}
