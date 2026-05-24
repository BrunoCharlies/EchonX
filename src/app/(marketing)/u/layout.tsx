import { AppShellHeader } from "@/components/app/app-shell-header";

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShellHeader />
      {children}
    </>
  );
}
