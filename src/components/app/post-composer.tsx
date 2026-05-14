"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compressImageForUpload } from "@/lib/image-compress.client";
import { createPost } from "@/server/actions/posts";

export function PostComposer() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        try {
          const outgoing = new FormData();
          outgoing.set("body", String(formData.get("body") ?? ""));

          const files = formData.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
          if (files.length > 4) {
            throw new Error("You can attach up to four images.");
          }

          for (const file of files) {
            const compressed = await compressImageForUpload(file);
            outgoing.append("images", compressed);
          }

          await createPost(outgoing);
          router.refresh();
          setMessage("Published.");
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Unable to publish.");
        }
      })();
    });
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card/70">
      <CardHeader>
        <CardTitle className="text-base">Create post</CardTitle>
        <CardDescription>Up to four WebP images, each moderated and capped at 2 MB.</CardDescription>
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
            <Textarea id="body" name="body" placeholder="What do you want people to hear?" rows={4} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="images">Images (optional)</Label>
            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground">
                <ImagePlus className="h-4 w-4" />
                Attach up to 4
                <input id="images" name="images" type="file" accept="image/*" multiple className="hidden" />
              </label>
            </div>
          </div>
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          <Button type="submit" className="w-full gap-2" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
