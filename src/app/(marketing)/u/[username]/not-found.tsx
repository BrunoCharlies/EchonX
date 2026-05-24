import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicProfileNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Profile not found</h1>
      <p className="text-sm text-muted-foreground">
        That handle does not exist yet. Explore public profiles or sign in to finish onboarding.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/explore">Explore profiles</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/login?callbackUrl=${encodeURIComponent("/app/onboarding")}`}>Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
