import { Badge } from "@/components/ui/badge";
import { officialChannelBadgeLabel } from "@/lib/curator/official-profiles";
import { cn } from "@/lib/utils";

export function isCuratorProfile(kind: string | null | undefined) {
  return kind === "curator";
}

type BadgeProps = {
  className?: string;
  ownerKey?: string | null;
  username?: string | null;
};

export function OfficialChannelBadge({ className, ownerKey, username }: BadgeProps) {
  const label = officialChannelBadgeLabel({ owner_x_user_id: ownerKey, username });
  const isQubic = label === "Qubic";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "border text-[10px] uppercase tracking-wide",
        isQubic
          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
          : "border-primary/25 bg-primary/10 text-primary",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
