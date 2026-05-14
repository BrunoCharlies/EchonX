"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWantToHear } from "@/server/actions/listen";
import { signIn } from "next-auth/react";

type Props = {
  profileId: string;
  initialSubscribed: boolean;
  isAuthenticated: boolean;
  signInCallbackUrl: string;
};

export function WantToHearButton({ profileId, initialSubscribed, isAuthenticated, signInCallbackUrl }: Props) {
  const router = useRouter();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setSubscribed(initialSubscribed);
  }, [initialSubscribed]);

  function onClick() {
    if (!isAuthenticated) {
      void signIn("twitter", { callbackUrl: signInCallbackUrl });
      return;
    }
    startTransition(() => {
      void (async () => {
        await toggleWantToHear(profileId);
        setSubscribed((v) => !v);
        router.refresh();
      })();
    });
  }

  return (
    <Button
      size="lg"
      className="sm:min-w-[200px]"
      variant={subscribed ? "secondary" : "default"}
      onClick={onClick}
      disabled={pending}
      aria-label="Assinar para ouvir"
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
      {subscribed ? "Listening" : "Want to Hear"}
    </Button>
  );
}
