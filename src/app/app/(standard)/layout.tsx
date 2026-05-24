import { AppShellHeader } from "@/components/app/app-shell-header";

/** Classic top nav for Explore, Settings, Discover, Onboarding. */
export default function AppStandardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <AppShellHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
