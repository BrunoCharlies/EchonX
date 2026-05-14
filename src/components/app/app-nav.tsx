"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/app", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/profile", label: "Profile" },
  { href: "/app/onboarding", label: "Setup" },
  { href: "/app/settings", label: "Settings" },
  { href: "/admin", label: "Admin" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            pathname === link.href && "bg-secondary text-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
      <Button variant="ghost" size="sm" type="button" onClick={() => void signOut({ callbackUrl: "/" })}>
        Log out
      </Button>
    </div>
  );
}
