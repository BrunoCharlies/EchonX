import Link from "next/link";
import { auth } from "@/auth";

export default async function ProfileShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link href="/app" className="text-sm font-semibold tracking-tight">
              EchonX
            </Link>
            <p className="text-xs text-muted-foreground">
              @{session?.user.twitterUsername ?? "you"} · role: {session?.user.role ?? "user"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/app" className="text-muted-foreground hover:text-foreground">
              App home
            </Link>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground">
              Profile
            </Link>
            <Link href="/explore" className="text-muted-foreground hover:text-foreground">
              Explore
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
