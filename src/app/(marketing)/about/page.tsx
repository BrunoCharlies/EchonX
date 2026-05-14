import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn why EchonX exists, who it serves, and how profile-first listening changes the social audio experience.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <h1 className="text-4xl font-semibold tracking-tight">About EchonX</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Social products trained us to scroll. EchonX trains us to listen. We are a US-first team building a premium dark
        experience where every relationship starts on a profile, not a faceless timeline.
      </p>
      <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Creators publish text with up to four images. Fans tap Want to Hear to opt into automatic voice playback for new
          posts. Native EchonX profiles remain free to read without limits, while external X profiles respect the listening
          allowances of your subscription.
        </p>
        <p>
          We take safety seriously: every profile photo and post image is moderated automatically before it goes live.
          Compression keeps uploads under two megabytes without sacrificing the crisp aesthetic you expect from a modern
          social app.
        </p>
        <p>
          Audio comments are a Pro superpower—short voice notes that feel personal yet stay gated behind the plan that
          funds advanced infrastructure.
        </p>
      </div>
    </div>
  );
}
