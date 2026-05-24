"use client";

import Link from "next/link";
import { ListenQueueProvider } from "@/components/listen/listen-queue-provider";

export default function AdminLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <ListenQueueProvider>
      <div className="space-y-6">
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
          <p className="font-medium text-amber-200">Development Lab</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/75">
            Sandboxed environment for testing. Changes here do not update the production Audiopost dashboard until you
            copy the approved code into the main components.
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Link href="/admin" className="hover:text-foreground">
            Admin
          </Link>
          <span aria-hidden>·</span>
          <Link href="/admin/lab" className="hover:text-foreground">
            Lab
          </Link>
        </nav>
        {children}
      </div>
    </ListenQueueProvider>
  );
}
