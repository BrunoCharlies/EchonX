import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import {
  audiopostListenBlockedMessage,
  canListenToAudiopostAuthorWithPlan,
  loadUserEntitlement,
} from "@/lib/billing/entitlements";
import { loadTopAudioposts } from "@/lib/explore/load-top-audioposts";
import type { PlanTier } from "@/lib/plans";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { AudiopostPlayButton } from "@/components/explore/audiopost-play-button";

type Labels = {
  title: string;
  body: string;
  empty: string;
  play: string;
  listens: string;
};

export async function TopAudiopostsCard({ labels }: { labels: Labels }) {
  const session = await auth();
  let effectivePlan: PlanTier = "free";
  if (session?.user.id) {
    const service = createServiceRoleClient();
    const entitlement = await loadUserEntitlement(service, session.user.id);
    effectivePlan = entitlement.effectivePlan;
  }
  const listenBlockedMessage = audiopostListenBlockedMessage(effectivePlan);
  const items = await loadTopAudioposts(10);

  return (
    <Card className="border-border/70 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          {labels.title}
        </CardTitle>
        <CardDescription>{labels.body}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ol className="space-y-3">
            {items.map((item, index) => (
              <li
                key={item.postId}
                className="flex gap-2 rounded-xl border border-border/60 bg-background/40 p-2.5"
              >
                <span className="mt-1 w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                    <Link
                      href={`/u/${item.authorUsername}`}
                      className="truncate text-sm font-medium text-foreground hover:text-primary"
                    >
                      {item.authorDisplayName}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">
                      @{item.authorUsername} · {item.playCount} {labels.listens}
                    </span>
                  </div>
                  <Link
                    href={`/u/${item.authorUsername}/p/${item.postId}`}
                    className="block text-xs leading-5 text-muted-foreground hover:text-foreground/90"
                  >
                    <span className="line-clamp-2">{item.excerpt}</span>
                  </Link>
                </div>
                <AudiopostPlayButton
                  postId={item.postId}
                  text={item.body}
                  ariaLabel={labels.play}
                  listenAllowed={canListenToAudiopostAuthorWithPlan(
                    {
                      kind: item.authorKind,
                      owner_x_user_id: item.authorOwnerXUserId,
                      username: item.authorUsername,
                    },
                    effectivePlan,
                  )}
                  listenBlockedMessage={listenBlockedMessage}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/30 p-4 text-xs leading-5 text-muted-foreground">
            {labels.empty}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
