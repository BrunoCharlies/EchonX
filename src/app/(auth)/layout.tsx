import Link from "next/link";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between gap-3">
        <Link href="/" className="inline-flex min-h-11 items-center">
          <EchonXLogo size="compact" />
        </Link>
        <LanguageSelector compact />
      </div>
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-5 shadow-sm max-sm:p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}
