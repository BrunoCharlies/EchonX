import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyProfile } from "@/server/actions/profile";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app/onboarding");
  }
  const profile = await getMyProfile();
  if (!profile) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10 text-sm text-muted-foreground">
        Profile is still provisioning. Try refreshing in a moment.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to EchonX</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set your public handle and bio. You can always edit again under <span className="text-foreground/90">/profile</span>.
        </p>
      </div>
      <ProfileEditForm initialDisplayName={profile.display_name ?? profile.name ?? null} initialUsername={profile.username} initialBio={profile.bio} />
    </div>
  );
}
