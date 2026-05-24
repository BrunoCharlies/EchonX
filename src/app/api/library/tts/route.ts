import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  billingLibraryUpgradeUrl,
  libraryUtf8ByteLength,
} from "@/lib/billing/library-quota-policy";
import { checkLibraryFishQuota, recordLibraryBytesConsumed } from "@/lib/billing/library-byte-usage";
import { loadLibraryEntitlement } from "@/lib/billing/library-entitlements";
import { fishApiKeyConfigured } from "@/lib/voice/fish-audio";
import { fishTtsStatusPayload, synthesizeFishTtsResponse, type FishTtsJsonBody } from "@/lib/voice/fish-tts-http";
import { prepareMirroredPostForSpeech } from "@/lib/voice/speech-text";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

function libraryStatusJson(entitlement: Awaited<ReturnType<typeof loadLibraryEntitlement>>) {
  const useFish = entitlement.fishActive && fishApiKeyConfigured();
  return {
    ...fishTtsStatusPayload("library"),
    backend: useFish ? "fish-s2-pro" : "web-speech",
    fishActive: entitlement.fishActive,
    plan: entitlement.plan,
    bytesConsumed: entitlement.bytesConsumed,
    periodByteQuota: entitlement.periodByteQuota,
    bytesRemaining: entitlement.bytesRemaining,
    exhaustedAction: entitlement.exhaustedAction,
    paidPlanExpired: entitlement.paidPlanExpired,
    currentPeriodEnd: entitlement.currentPeriodEnd,
    upgradeUrl: entitlement.exhaustedAction?.kind === "upgrade"
      ? billingLibraryUpgradeUrl(entitlement.exhaustedAction.targetPlan)
      : null,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const entitlement = await loadLibraryEntitlement(supabase, session.user.id);
  return NextResponse.json(libraryStatusJson(entitlement));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!fishApiKeyConfigured()) {
    return NextResponse.json(
      { error: "Fish Audio API key missing. Set FISH_AUDIO_API_KEY in .env.local." },
      { status: 503 },
    );
  }

  let body: FishTtsJsonBody;
  try {
    body = (await request.json()) as FishTtsJsonBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw = String(body.text ?? "").trim();
  const text = prepareMirroredPostForSpeech(raw);
  if (!text) {
    return NextResponse.json({ error: "no_speakable_text" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const quota = await checkLibraryFishQuota(supabase, session.user.id, text);

  if (!quota.ok) {
    const upgradeUrl =
      quota.entitlement.exhaustedAction?.kind === "upgrade"
        ? billingLibraryUpgradeUrl(quota.entitlement.exhaustedAction.targetPlan)
        : null;
    return NextResponse.json(
      {
        error:
          quota.code === "LIBRARY_QUOTA_EXHAUSTED"
            ? "Monthly Library voice allowance used up."
            : "Library Premium is required for Fish voice.",
        code: quota.code,
        exhaustedAction: quota.entitlement.exhaustedAction,
        bytesRemaining: quota.entitlement.bytesRemaining,
        upgradeUrl,
      },
      { status: 403 },
    );
  }

  const response = await synthesizeFishTtsResponse(body);
  if (!response.ok) return response;

  const chargedBytes = libraryUtf8ByteLength(text);
  await recordLibraryBytesConsumed(supabase, session.user.id, chargedBytes);

  const headers = new Headers(response.headers);
  headers.set("X-Library-Bytes-Charged", String(chargedBytes));

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
