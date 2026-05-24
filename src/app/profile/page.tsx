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
    <div className="mx-auto max-w-2xl space-y-6 py-4 max-lg:py-2 sm:space-y-8 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Photo, bio, and @username are public. Images are reviewed automatically before they are saved.
          </p>
        </div>
        <Button variant="outline" size="sm" className="min-h-11 w-full sm:w-auto" asChild>
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
