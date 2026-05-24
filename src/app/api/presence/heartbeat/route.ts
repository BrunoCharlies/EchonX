import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** Updates `profiles.last_seen_at` for lightweight online/offline heuristics in the admin dashboard. */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, skipped: "unauthorized" });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.user.id);

    if (error) {
      if (error.code !== "PGRST204") {
        console.error("[presence/heartbeat] update failed", error);
      }
      return NextResponse.json({ ok: false, skipped: "update_failed" });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[presence/heartbeat] unexpected failure", error);
    return NextResponse.json({ ok: false, skipped: "unexpected_failure" });
  }
}
