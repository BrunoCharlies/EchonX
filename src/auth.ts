import { createClient } from "@/lib/supabase/server";

/** Server session for signed-in native users (`auth.users.id` === native `profiles.id`). */
export type AppSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "user" | "admin";
    twitterUsername: string | null;
  };
};

export async function auth(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, username, display_name, name")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const name =
    (profile?.name as string | null)?.trim() ||
    (profile?.display_name as string | null)?.trim() ||
    (typeof meta?.display_name === "string" && meta.display_name.trim()) ||
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    user.email?.split("@")[0] ||
    null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name,
      role: profile?.role === "admin" ? "admin" : "user",
      twitterUsername: (profile?.username as string | null) ?? null,
    },
  };
}
