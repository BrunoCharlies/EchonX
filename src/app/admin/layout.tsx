import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold tracking-tight">EchonX Admin</p>
            <p className="text-xs text-muted-foreground">Operational overview (synthetic metrics until wired to Supabase).</p>
          </div>
          <Link href="/app" className="text-xs text-muted-foreground hover:text-foreground">
            Back to app
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
