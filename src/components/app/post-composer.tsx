"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compressImageForUpload } from "@/lib/image-compress.client";
import { cn } from "@/lib/utils";
import { createPost } from "@/server/actions/posts";

const BODY_MAX = 500;
/** Mostra contagem só quando o utilizador se aproxima do limite. */
const BODY_LIMIT_HINT_FROM = 450;

type Props = {
  onPublished?: () => void;
};

export function PostComposer({ onPublished }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const showCharLimit = body.length >= BODY_LIMIT_HINT_FROM;

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        try {
          const outgoing = new FormData();
          outgoing.set("body", String(formData.get("body") ?? ""));

          const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
          if (files.length > 1) {
            throw new Error("You can attach one image per post.");
          }

          for (const file of files) {
            const compressed = await compressImageForUpload(file);
            outgoing.append("images", compressed);
          }

          await createPost(outgoing);
          router.refresh();
          setBody("");
          setMessage("Published.");
          onPublished?.();
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Unable to publish.");
        }
      })();
    });
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card/70">
      <CardHeader>
        <CardTitle className="text-base">New post</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void handleSubmit(fd);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="body">Text</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="What do you want people to hear?"
              rows={4}
              maxLength={BODY_MAX}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {showCharLimit ? (
              <p
                className={cn(
                  "text-xs tabular-nums",
                  body.length >= BODY_MAX ? "font-medium text-destructive" : "text-amber-500/90",
                )}
              >
                {body.length}/{BODY_MAX} characters
                {body.length >= BODY_MAX ? " — limit reached" : ""}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="images">Image (optional)</Label>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground">
                <ImagePlus className="h-4 w-4" />
                Attach image
                <input id="images" name="images" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Recommended: 1200 × 675 px, JPG/PNG/WebP, up to 2 MB.</p>
          </div>
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          <Button type="submit" className="w-full gap-2 transition active:scale-[0.98]" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
