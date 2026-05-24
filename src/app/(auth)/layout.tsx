import Link from "next/link";
import { EchonXLogo } from "@/components/brand/echonx-logo";
import { LanguageSelector } from "@/components/i18n/language-selector";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between">
        <Link href="/" className="inline-flex items-center">
          <EchonXLogo imageClassName="h-7" />
        </Link>
        <LanguageSelector compact />
      </div>
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
