import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";

function Fallback() {
  return <p className="text-center text-sm text-muted-foreground">Loading…</p>;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/app/explore");
  }

  const sp = await searchParams;
  const raw = sp.callbackUrl ?? "/app/explore";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app/explore";

  return (
    <Suspense fallback={<Fallback />}>
      <RegisterForm callbackUrl={callbackUrl} />
    </Suspense>
  );
}
