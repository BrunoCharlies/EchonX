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
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";

type AfterSave = "public-profile" | "stay-on-profile";

type Props = {
  initialDisplayName: string | null;
  initialUsername: string;
  initialBio: string | null;
  afterSave?: AfterSave;
};

export function ProfileEditForm({ initialDisplayName, initialUsername, initialBio, afterSave = "public-profile" }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        try {
          const outgoing = new FormData();
          outgoing.set("displayName", String(formData.get("displayName") ?? ""));
          outgoing.set("username", String(formData.get("username") ?? ""));
          outgoing.set("bio", String(formData.get("bio") ?? ""));

          const avatar = formData.get("avatar");
          if (avatar instanceof File && avatar.size > 0) {
            const compressed = await compressImageForUpload(avatar);
            outgoing.set("avatar", compressed);
          }

          const cover = formData.get("cover");
          if (cover instanceof File && cover.size > 0) {
            const compressed = await compressImageForUpload(cover);
            outgoing.set("cover", compressed);
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
        <Label htmlFor="cover">Profile cover</Label>
        <Input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
        <p className="text-xs text-muted-foreground">Recommended: 1500 × 500 px, JPG/PNG/WebP, up to 2 MB.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" defaultValue={initialDisplayName ?? ""} placeholder="Your display name" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={initialUsername} placeholder="you" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initialBio ?? ""}
          placeholder="Short profile phrase. No links."
          rows={3}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">Maximum 50 characters. Links are not allowed.</p>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <ThemeModeToggle />
        <Button type="submit" className="w-full sm:w-auto sm:min-w-[160px]" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </div>
    </form>
  );
}
