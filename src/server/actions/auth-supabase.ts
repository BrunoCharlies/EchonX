"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAppOrigin } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { resolveEmailAppRole } from "@/lib/sync/twitter-to-supabase";

const emailField = z.string().email().transform((s) => s.trim().toLowerCase());
const passwordField = z.string().min(8, "Password must be at least 8 characters.");
const nameField = z.string().trim().min(1, "Name is required.").max(120, "Name is too long.");

export type AuthActionResult<T = void> = ({ ok: true } & (T extends void ? object : T)) | { ok: false; error: string };

async function waitForProfile(userId: string, maxAttempts = 8) {
  const admin = createServiceRoleClient();
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    if (data?.id) return true;
    await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
  }
  return false;
}

function revalidateAfterAuth() {
  revalidatePath("/app/explore");
  revalidatePath("/app");
}

async function applyAdminRoleIfNeeded(userId: string, email: string) {
  if (resolveEmailAppRole(email) !== "admin") return;
  const admin = createServiceRoleClient();
  await admin.from("profiles").update({ role: "admin", updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function signInWithPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const emailParse = emailField.safeParse(String(formData.get("email") ?? ""));
  const passParse = passwordField.safeParse(String(formData.get("password") ?? ""));
  if (!emailParse.success) return { ok: false, error: emailParse.error.issues[0]?.message ?? "Invalid email." };
  if (!passParse.success) return { ok: false, error: passParse.error.issues[0]?.message ?? "Invalid password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailParse.data,
    password: passParse.data,
  });

  if (error) {
    return {
      ok: false,
      error: error.message === "Invalid login credentials" ? "Invalid email or password." : error.message,
    };
  }
  if (!data.user?.id) return { ok: false, error: "Sign-in succeeded but no user was returned." };

  if (!(await waitForProfile(data.user.id, 1))) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (!(await waitForProfile(data.user.id, 1))) {
      return { ok: false, error: "Your profile is still being created. Try again in a few seconds." };
    }
  }

  revalidateAfterAuth();
  return { ok: true };
}

export async function signUpWithPasswordAction(
  formData: FormData,
): Promise<AuthActionResult<{ needsEmailConfirmation: boolean }>> {
  const emailParse = emailField.safeParse(String(formData.get("email") ?? ""));
  const passParse = passwordField.safeParse(String(formData.get("password") ?? ""));
  const nameParse = nameField.safeParse(String(formData.get("name") ?? ""));
  if (!emailParse.success) return { ok: false, error: emailParse.error.issues[0]?.message ?? "Invalid email." };
  if (!passParse.success) return { ok: false, error: passParse.error.issues[0]?.message ?? "Invalid password." };
  if (!nameParse.success) return { ok: false, error: nameParse.error.issues[0]?.message ?? "Invalid name." };

  const email = emailParse.data;
  const name = nameParse.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: passParse.data,
    options: {
      data: { display_name: name, full_name: name },
      emailRedirectTo: `${getAppOrigin()}/auth/callback?next=/app`,
    },
  });

  if (error) return { ok: false, error: error.message };
  if (!data.user?.id) return { ok: false, error: "Sign up did not return a user." };

  await applyAdminRoleIfNeeded(data.user.id, email);

  const needsEmailConfirmation = !data.session;
  if (!needsEmailConfirmation && !(await waitForProfile(data.user.id))) {
    return {
      ok: false,
      error: "Account created but profile setup failed. Apply the Supabase auth profile trigger migration and try signing in.",
    };
  }

  revalidateAfterAuth();
  return { ok: true, needsEmailConfirmation };
}

export async function requestPasswordResetAction(formData: FormData): Promise<{ message: string }> {
  const emailParse = emailField.safeParse(String(formData.get("email") ?? ""));
  if (!emailParse.success) {
    return { message: "If an account exists for that address, you will receive an email with a reset link." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(emailParse.data, {
    redirectTo: `${getAppOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) console.error("[requestPasswordResetAction]", error);

  return { message: "If an account exists for that address, you will receive an email with a reset link." };
}

export async function updatePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const passParse = passwordField.safeParse(String(formData.get("password") ?? ""));
  if (!passParse.success) return { ok: false, error: passParse.error.issues[0]?.message ?? "Invalid password." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your reset session expired. Request a new link from forgot password." };

  const { error } = await supabase.auth.updateUser({ password: passParse.data });
  if (error) return { ok: false, error: error.message };

  revalidateAfterAuth();
  return { ok: true };
}
