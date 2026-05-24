import { auth } from "@/auth";
import { AppShell } from "@/components/app/app-shell";
import { loadListeningPlanUsage } from "@/lib/billing/load-listening-usage";
import { getMyProfile } from "@/server/actions/profile";

/** Sidebar + top bar — only `/app` (Audiopost home). */
export default async function AudiopostLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const profile = await getMyProfile();
  const usageResult = await loadListeningPlanUsage();

  const publicProfileHref = session?.user.twitterUsername
    ? `/u/${session.user.twitterUsername}`
    : "/app/onboarding";

  const displayName = profile?.display_name ?? profile?.name ?? session?.user?.name ?? "Listener";
  const planBadge =
    usageResult.ok && usageResult.usage.entitlement.effectivePlan !== "free"
      ? `${usageResult.usage.entitlement.effectivePlan.charAt(0).toUpperCase()}${usageResult.usage.entitlement.effectivePlan.slice(1)}`
      : "Free";

  return (
    <AppShell
      audiopostDark
      publicProfileHref={publicProfileHref}
      displayName={displayName}
      planBadge={planBadge}
      avatarUrl={profile?.avatar_path ?? null}
    >
      {children}
    </AppShell>
  );
}
