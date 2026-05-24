"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImageForUpload } from "@/lib/image-compress.client";
import {
  isAllowedProfileImageFile,
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_SIZE_MESSAGE,
  PROFILE_IMAGE_TYPE_MESSAGE,
} from "@/lib/uploads/profile-images";
import {
  isValidUsername,
  normalizeUsernameInput,
  USERNAME_HINT,
  USERNAME_VALIDATION_MESSAGE,
} from "@/lib/profiles/username";
import { updateNativeProfile } from "@/server/actions/profile";
import { ThemeModeToggle } from "@/components/theme/theme-mode-toggle";

type AfterSave = "public-profile" | "stay-on-profile";

type Props = {
  initialDisplayName: string | null;
  initialUsername: string;
  initialBio: string | null;
  afterSave?: AfterSave;
};

function readErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message?: unknown }).message);
    if (message && !message.includes("Server Components render")) return message;
  }
  return "";
}

export function ProfileEditForm({
  initialDisplayName,
  initialUsername,
  initialBio,
  afterSave = "public-profile",
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(() => {
      void (async () => {
        try {
          const avatar = formData.get("avatar");
          if (avatar instanceof File && avatar.size > 0) {
            if (!isAllowedProfileImageFile(avatar)) {
              setMessage(`Profile photo: ${PROFILE_IMAGE_TYPE_MESSAGE}`);
              return;
            }
          }

          const cover = formData.get("cover");
          if (cover instanceof File && cover.size > 0) {
            if (!isAllowedProfileImageFile(cover)) {
              setMessage(`Profile cover: ${PROFILE_IMAGE_TYPE_MESSAGE}`);
              return;
            }
          }

          const handle = normalizeUsernameInput(String(formData.get("username") ?? ""));
          if (!isValidUsername(handle)) {
            setMessage(USERNAME_VALIDATION_MESSAGE);
            return;
          }

          const outgoing = new FormData();
          outgoing.set("displayName", String(formData.get("displayName") ?? ""));
          outgoing.set("username", handle);
          outgoing.set("bio", String(formData.get("bio") ?? ""));

          if (avatar instanceof File && avatar.size > 0) {
            const compressed = await compressImageForUpload(avatar);
            if (compressed.size > 2 * 1024 * 1024) {
              setMessage(`Profile photo: ${PROFILE_IMAGE_SIZE_MESSAGE}`);
              return;
            }
            outgoing.set("avatar", compressed);
          }

          if (cover instanceof File && cover.size > 0) {
            const compressed = await compressImageForUpload(cover);
            if (compressed.size > 2 * 1024 * 1024) {
              setMessage(`Profile cover: ${PROFILE_IMAGE_SIZE_MESSAGE}`);
              return;
            }
            outgoing.set("cover", compressed);
          }

          await updateNativeProfile(outgoing);
          if (afterSave === "public-profile") {
            router.push(`/u/${encodeURIComponent(handle)}`);
          } else {
            router.refresh();
          }
        } catch (err) {
          const detail = readErrorMessage(err);
          setMessage(
            detail ||
              "We could not save your profile. Use JPEG or PNG images (max 2 MB each) and try again.",
          );
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
        <Input id="avatar" name="avatar" type="file" accept={PROFILE_IMAGE_ACCEPT} />
        <p className="text-xs text-muted-foreground">JPEG or PNG only, up to 2 MB.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cover">Profile cover</Label>
        <Input id="cover" name="cover" type="file" accept={PROFILE_IMAGE_ACCEPT} />
        <p className="text-xs text-muted-foreground">
          JPEG or PNG only, up to 2 MB. Recommended size: 1500 × 500 px.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialDisplayName ?? ""}
          placeholder="Your display name"
          required
          maxLength={80}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/40 select-none"
            aria-hidden
          >
            @
          </span>
          <Input
            id="username"
            name="username"
            defaultValue={initialUsername}
            placeholder="bcharles"
            className="pl-7"
            required
            autoComplete="username"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
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
      {message ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90" role="alert">
          {message}
        </p>
      ) : null}
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
