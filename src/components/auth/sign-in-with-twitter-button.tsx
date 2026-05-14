"use client";

import type { ComponentProps } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentProps<typeof Button>;

export type SignInWithTwitterButtonProps = Omit<ButtonProps, "type"> & {
  /** Where the user lands after a successful OAuth callback (path or absolute URL on this origin). */
  callbackUrl: string;
};

/**
 * Starts Twitter/X OAuth 2.0 with PKCE via NextAuth (POST /api/auth/signin/twitter).
 * Do not use a plain GET link to `/api/auth/signin/twitter` — Auth.js v5 rejects it with UnknownAction.
 */
export function SignInWithTwitterButton({
  callbackUrl,
  className,
  children,
  onClick,
  ...buttonProps
}: SignInWithTwitterButtonProps) {
  return (
    <Button
      type="button"
      className={cn(className)}
      onClick={(e) => {
        onClick?.(e);
        void signIn("twitter", { callbackUrl });
      }}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}
