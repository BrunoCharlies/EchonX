import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { DEV_LAB_ENTRIES } from "@/lib/admin/dev-lab-registry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminLabIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <FlaskConical className="h-6 w-6 text-amber-400" />
          Feature labs
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each lab is a safe copy or isolated surface for experiments. Successful tests are merged into the main app
          manually — the production routes stay unchanged until then.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEV_LAB_ENTRIES.map((entry) => (
          <Card
            key={entry.slug}
            className={cn(
              "border-border/70 bg-card/60",
              entry.status === "planned" && "opacity-60",
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">{entry.title}</CardTitle>
              <CardDescription>{entry.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {entry.status === "active" ? (
                <Button size="sm" asChild>
                  <Link href={entry.href}>Open lab</Link>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Coming soon</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
