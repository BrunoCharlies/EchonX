import { auth } from "@/auth";
import { AppShellHeaderClient } from "@/components/app/app-shell-header-client";
import { loadListeningPlanUsage } from "@/lib/billing/load-listening-usage";
import { getServerDictionary } from "@/lib/i18n/server";

/** Top bar for Explore, Profile, Settings, public /u/* — desktop frozen at lg; mobile drawer below lg. */
export async function AppShellHeader() {
  const session = await auth();
  const t = await getServerDictionary();
  const usageResult = await loadListeningPlanUsage();

  const publicProfileHref = session?.user.twitterUsername
    ? `/u/${session.user.twitterUsername}`
    : "/app/onboarding";

  const planBadge =
    usageResult.ok && usageResult.usage.entitlement.effectivePlan !== "free"
      ? `${usageResult.usage.entitlement.effectivePlan.charAt(0).toUpperCase()}${usageResult.usage.entitlement.effectivePlan.slice(1)}`
      : "Free";

  return (
    <AppShellHeaderClient
      isAuthenticated={Boolean(session?.user)}
      isAdmin={session?.user.role === "admin"}
      publicProfileHref={publicProfileHref}
      planBadge={planBadge}
      openAppLabel={t.common.openApp}
      signInLabel={t.common.signIn}
    />
  );
}
