import Link from "next/link";
import { auth } from "@/auth";
import { AppNav } from "@/components/app/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link href="/app" className="text-sm font-semibold tracking-tight">
              EchonX
            </Link>
            <p className="text-xs text-muted-foreground">
              Signed in as @{session?.user.twitterUsername ?? session?.user.name ?? "listener"} · Supertonic ready
            </p>
          </div>
          <AppNav />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}