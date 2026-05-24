import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyProfile } from "@/server/actions/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const profile = await getMyProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-sm text-muted-foreground">
        We could not load your profile. Try signing out and back in.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Photo, bio, and @username are public. Images are moderated via the Supabase Edge Function before storage.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/u/${profile.username}`}>View public page</Link>
        </Button>
      </div>
      <ProfileEditForm
        initialDisplayName={profile.display_name ?? profile.name ?? null}
        initialUsername={profile.username}
        initialBio={profile.bio}
        afterSave="stay-on-profile"
      />
    </div>
  );
}
