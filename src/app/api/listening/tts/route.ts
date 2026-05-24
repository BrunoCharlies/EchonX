import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canUseFishAudiopostTts as planIncludesFishAudiopost } from "@/lib/billing/voice-products";
import { loadUserEntitlement } from "@/lib/billing/entitlements";
import { fishApiKeyConfigured } from "@/lib/voice/fish-audio";
import { fishTtsStatusPayload, synthesizeFishTtsResponse, type FishTtsJsonBody } from "@/lib/voice/fish-tts-http";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

function audiopostFishTtsEnabled(effectivePlan: Parameters<typeof planIncludesFishAudiopost>[0]) {
  return planIncludesFishAudiopost(effectivePlan) && fishApiKeyConfigured();
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const entitlement = await loadUserEntitlement(supabase, session.user.id);
  const useFish = audiopostFishTtsEnabled(entitlement.effectivePlan);

  return NextResponse.json({
    ...fishTtsStatusPayload("audiopost"),
    backend: useFish ? "fish-s2-pro" : "web-speech",
    effectivePlan: entitlement.effectivePlan,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const entitlement = await loadUserEntitlement(supabase, session.user.id);
  if (!audiopostFishTtsEnabled(entitlement.effectivePlan)) {
    return NextResponse.json(
      {
        error: "Fish TTS is included with Starter, Popular, and Pro. Free uses browser Web Speech.",
        code: "PLAN_VOICE",
      },
      { status: 403 },
    );
  }

  let body: FishTtsJsonBody;
  try {
    body = (await request.json()) as FishTtsJsonBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  return synthesizeFishTtsResponse(body);
}
