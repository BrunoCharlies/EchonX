/**
 * Supabase Edge Function: moderates an image using Sightengine.
 *
 * Configure secrets in Supabase Dashboard → Edge Functions → Secrets:
 *   MODERATION_API_USER, MODERATION_API_SECRET
 *
 * Request JSON: { imageBase64: string, mimeType?: string }
 * Response JSON: { ok: boolean, provider: string, reason?: string }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiUser = Deno.env.get("MODERATION_API_USER") ?? "";
    const apiSecret = Deno.env.get("MODERATION_API_SECRET") ?? "";

    if (!apiUser || !apiSecret) {
      return new Response(
        JSON.stringify({ ok: false, provider: "sightengine", reason: "moderation_keys_missing" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { imageBase64, mimeType } = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      return new Response(JSON.stringify({ ok: false, provider: "sightengine", reason: "missing_image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const binary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([binary], { type: mimeType ?? "image/webp" });

    const form = new FormData();
    form.append("media", blob, "upload.jpg");
    form.append("models", "nudity-2.0,weapon,recreational_drug");
    form.append("api_user", apiUser);
    form.append("api_secret", apiSecret);

    const res = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, provider: "sightengine", reason: "moderation_http_error" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = (await res.json()) as {
      status?: string;
      nudity?: { sexual_activity?: number; sexual_display?: number; erotica?: number };
    };

    if (json.status !== "success") {
      return new Response(JSON.stringify({ ok: false, provider: "sightengine", reason: "moderation_parse_error", raw: json }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const n = json.nudity;
    const sexualScore = Math.max(n?.sexual_activity ?? 0, n?.sexual_display ?? 0, n?.erotica ?? 0);
    if (sexualScore > 0.65) {
      return new Response(JSON.stringify({ ok: false, provider: "sightengine", reason: "adult_content", raw: json }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, provider: "sightengine", raw: json }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return new Response(JSON.stringify({ ok: false, provider: "sightengine", reason: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
