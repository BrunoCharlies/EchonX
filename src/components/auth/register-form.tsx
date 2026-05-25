"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { trackSignUp } from "@/lib/analytics/events";
import { signUpWithPasswordAction } from "@/server/actions/auth-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { XOAuthButton } from "@/components/auth/x-oauth-button";
import { useI18n } from "@/lib/i18n/client";

type Props = {
  callbackUrl: string;
};

export function RegisterForm({ callbackUrl }: Props) {
  const router = useRouter();
  const { dictionary: t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const safeCallback =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/app";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpWithPasswordAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.needsEmailConfirmation) {
        trackSignUp("email");
        setInfo(t.auth.confirmEmail);
        return;
      }
      trackSignUp("email");
      router.push(safeCallback);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.auth.createAccount}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.registerBody}</p>
      </div>

      {info && (
        <p className="rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-900 dark:text-sky-100">
          {info}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t.auth.name}</Label>
          <Input id="name" name="name" type="text" autoComplete="name" required maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">{t.auth.minPassword}</p>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t.auth.creating : t.auth.register}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{t.auth.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <XOAuthButton callbackUrl={safeCallback} label={t.auth.signUpWithX} />

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.alreadyAccount}{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(safeCallback)}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {t.auth.signInTitle}
        </Link>
      </p>
    </div>
  );
}
