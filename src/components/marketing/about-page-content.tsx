import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Globe,
  Lock,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  User,
  Waves,
} from "lucide-react";
import { HeroSignalVisual } from "@/components/marketing/hero-signal-visual";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_POINTS = [
  { icon: Globe, text: "US-first team" },
  { icon: Lock, text: "Privacy by design" },
  { icon: Waves, text: "Real-time listening" },
  { icon: Users, text: "Creators & communities" },
] as const;

const HOW_STEPS = [
  {
    step: "01",
    title: "You speak",
    description: "Share posts and voice from your profile—your audience opts in to hear you.",
    icon: Mic,
  },
  {
    step: "02",
    title: "We listen",
    description: "New posts flow into personalized audio queues for people who follow you.",
    icon: Radio,
  },
  {
    step: "03",
    title: "People connect",
    description: "Listeners discover you through profiles and intentional follows—not endless feeds.",
    icon: Users,
  },
  {
    step: "04",
    title: "Communities grow",
    description: "Conversations deepen when everyone can hear what matters.",
    icon: Sparkles,
  },
] as const;

const SAFETY_POINTS = [
  { icon: ShieldCheck, text: "Automatic moderation on uploads" },
  { icon: Lock, text: "Secure by design" },
  { icon: User, text: "Creator-first controls" },
] as const;

const STATS = [
  { value: "100K+", label: "Active listeners", icon: Users },
  { value: "2.5M+", label: "Audio posts queued", icon: Waves },
  { value: "99.9%", label: "Moderation accuracy", icon: Clock },
  { value: "4.8/5", label: "Creator satisfaction", icon: Star },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "EchonX turned my timeline into something I can actually keep up with. My fans hear new posts without me repeating myself.",
    name: "Jordan Lee",
    role: "Indie musician",
    featured: false,
  },
  {
    quote:
      "Profile-first listening changed how we run our community. People show up for voices, not vanity metrics.",
    name: "Maya Chen",
    role: "Community lead",
    featured: true,
  },
  {
    quote:
      "I follow a handful of creators on X and catch every post in my queue. It feels calm, not chaotic.",
    name: "Alex Rivera",
    role: "Daily listener",
    featured: false,
  },
] as const;

const PRESS = ["TechCrunch", "The Verge", "Forbes", "Fast Company", "Wired"] as const;

function SafetyShieldVisual() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center">
      <div className="absolute inset-8 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-[280px] rounded-3xl border border-border/60 bg-gradient-to-b from-card/90 to-background/80 p-10 shadow-2xl shadow-primary/10">
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/40">
          <ShieldCheck className="h-16 w-16 text-primary" strokeWidth={1.25} />
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Built with privacy and respect at the core.
        </p>
      </div>
    </div>
  );
}

export function AboutPageContent() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24 lg:px-8">
          <div className="relative z-10 space-y-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">About EchonX</p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Every voice starts on <span className="text-primary">X</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
              EchonX is the social listening layer where connections begin with a profile—not an endless scroll. Hear
              voices, follow creators, and build communities around what people actually say.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {HERO_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 lg:pl-4">
            <HeroSignalVisual />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 rounded-3xl border border-border/60 bg-card/40 p-8 sm:grid-cols-2 sm:items-center sm:gap-12 sm:p-10 lg:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Our mission</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              To build the most trusted place to share, hear, and grow with voice.
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            We believe depth beats distraction. EchonX is designed so creators publish once, listeners opt in with
            intention, and every relationship stays anchored to a real profile—not an algorithmic feed that never
            stops moving.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/40 bg-muted/10 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">How EchonX works</p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for effortless connection.
          </h2>
          <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px border-t border-dashed border-primary/30 lg:block"
              aria-hidden
            />
            {HOW_STEPS.map(({ step, title, description, icon: Icon }) => (
              <div key={step} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/10">
                  <Icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">{step}</p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Safe. Secure. Respectful.</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your voice is protected.</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every image is reviewed before it goes live. Uploads are optimized for clarity without slowing you down.
              You stay in control of who hears you and what enters your queue.
            </p>
          </div>
          <ul className="space-y-4">
            {SAFETY_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <SafetyShieldVisual />
      </section>

      {/* Stats */}
      <section className="border-t border-border/40 bg-card/20 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Trusted by creators & listeners
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold tracking-tight">Real people. Real conversations.</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className={cn(
                "flex flex-col rounded-2xl border bg-card/50 p-6 sm:p-8",
                item.featured
                  ? "border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border/60",
              )}
            >
              <p className="flex-1 text-sm leading-relaxed text-foreground/90">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {item.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-2 w-2 rounded-full",
                i === 1 ? "bg-primary w-6" : "bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      </section>

      {/* Press */}
      <section className="border-y border-border/40 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            In the press
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
            {PRESS.map((name) => (
              <span
                key={name}
                className="text-lg font-semibold tracking-tight text-muted-foreground/50 sm:text-xl"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,hsl(270_60%_50%/0.15),transparent_55%),radial-gradient(ellipse_60%_60%_at_80%_20%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your voice belongs here.</h2>
            <p className="mt-3 text-muted-foreground">
              Join EchonX and start hearing—and being heard—today.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/app/explore">
                Open EchonX
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login?callbackUrl=%2Fapp%2Fexplore">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
