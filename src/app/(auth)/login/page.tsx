import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading sign-in form">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mx-auto h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email-fallback">Email</Label>
          <Input id="login-email-fallback" disabled className="opacity-60" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password-fallback">Password</Label>
          <Input id="login-password-fallback" type="password" disabled className="opacity-60" />
        </div>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.callbackUrl ?? "/app/explore";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app/explore";

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm callbackUrl={callbackUrl} />
    </Suspense>
  );
}
