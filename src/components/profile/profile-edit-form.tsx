"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/image-compress.client";
import { updateNativeProfile } from "@/server/actions/profile";

type AfterSave = "public-profile" | "stay-on-profile";

type Props = {
  initialUsername: string;
  initialBio: string | null;
  afterSave?: AfterSave;
};

export function ProfileEditForm({ initialUsername, initialBio, afterSave = "public-profile" }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        try {
          const outgoing = new FormData();
          outgoing.set("username", String(formData.get("username") ?? ""));
          outgoing.set("bio", String(formData.get("bio") ?? ""));

          const avatar = formData.get("avatar");
          if (avatar instanceof File && avatar.size > 0) {
            const compressed = await compressImageForUpload(avatar);
            outgoing.set("avatar", compressed);
          }

          await updateNativeProfile(outgoing);
          const handle = String(formData.get("username") ?? "").trim().toLowerCase();
          if (afterSave === "public-profile") {
            router.push(`/u/${encodeURIComponent(handle)}`);
          } else {
            router.push("/profile");
          }
          router.refresh();
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Unable to save profile.");
        }
      })();
    });
  }

  return (
    <form
      className="space-y-6 rounded-xl border border-border/80 bg-card/60 p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void handleSubmit(fd);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="avatar">Profile photo</Label>
        <Input id="avatar" name="avatar" type="file" accept="image/*" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={initialUsername} placeholder="you" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initialBio ?? ""} placeholder="Tell listeners what you sound like." rows={4} />
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </form>
  );
}
