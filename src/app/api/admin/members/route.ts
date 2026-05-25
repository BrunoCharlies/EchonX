import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadAdminMembers } from "@/lib/admin/load-admin-members";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Não foi possível carregar os membros.";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const supabase = createServiceRoleClient();
    const payload = await loadAdminMembers(supabase);
    return NextResponse.json(payload);
  } catch (err) {
    const message = errorMessage(err);
    console.error("[admin/members]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
