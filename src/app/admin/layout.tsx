import Link from "next/link";
import "./admin-shell.css";
import { EchonXLogo } from "@/components/brand/echonx-logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div className="admin-shell__header-inner">
          <div className="flex items-center gap-2.5">
            <Link href="/app/explore" className="inline-flex shrink-0">
              <EchonXLogo imageClassName="h-6" />
            </Link>
            <span className="admin-shell__badge">Admin</span>
          </div>
          <Link
            href="/app/explore"
            className="text-[11px] text-[rgba(232,237,244,0.55)] transition hover:text-[#eef3f9]"
          >
            ← Voltar ao app
          </Link>
        </div>
      </header>
      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
