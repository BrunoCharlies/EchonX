"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, AudioWaveform, CheckCircle2, ChevronRight, LockKeyhole, Mic, Shield, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/client";
import { HeroSignalVisual } from "@/components/marketing/hero-signal-visual";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { dictionary: t } = useI18n();
  const featureCards = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t.marketing.cardProfilesTitle,
      body: t.marketing.cardProfilesBody,
    },
    {
      icon: <Mic className="h-8 w-8 text-accent" />,
      title: t.marketing.cardVoiceTitle,
      body: t.marketing.cardVoiceBody,
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: t.marketing.cardModerationTitle,
      body: t.marketing.cardModerationBody,
    },
  ];
  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "100K+", label: t.marketing.activeListeners },
    { icon: <AudioWaveform className="h-5 w-5" />, value: "2.5M+", label: t.marketing.queuedPosts },
    { icon: <Shield className="h-5 w-5" />, value: "99.9%", label: t.marketing.moderationAccuracy },
    { icon: <LockKeyhole className="h-5 w-5" />, value: "Private", label: t.marketing.privateQueue },
  ];
  const sections = [
    { title: t.marketing.sections.nativeProfiles, body: t.marketing.sections.nativeProfilesBody },
    { title: t.marketing.sections.externalProfiles, body: t.marketing.sections.externalProfilesBody },
    { title: t.marketing.sections.freshPosts, body: t.marketing.sections.freshPostsBody },
    { title: t.marketing.sections.olderPosts, body: t.marketing.sections.olderPostsBody },
  ];

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_18%_28%,hsl(var(--accent)/0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-[0.22]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="relative grid min-h-[620px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[0.92fr_1.08fr] lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="relative z-10 flex flex-col justify-center">
              <motion.div variants={fadeUp}>
                <Badge variant="secondary" className="mb-5 w-fit border border-primary/25 bg-primary/10 text-foreground shadow-[0_0_24px_hsl(var(--primary)/0.15)]">
                  <AudioWaveform className="mr-1 h-3.5 w-3.5 text-primary" />
                  {t.marketing.badge}
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} className="max-w-xl text-balance text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {t.marketing.headlineA}{" "}
                <span className="text-primary drop-shadow-[0_0_18px_hsl(var(--primary)/0.35)]">
                  {t.marketing.headlineB}
                </span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                {t.marketing.body}
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button size="lg" className="h-12 rounded-xl px-8 text-base shadow-[0_0_28px_hsl(var(--primary)/0.35)]" asChild>
                  <Link href="/register?callbackUrl=%2Fapp%2Fexplore">
                    {t.common.getStarted}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-white/15 bg-white/5 px-8 text-base" asChild>
                  <Link href="/login?callbackUrl=%2Fapp%2Fexplore">{t.common.signIn}</Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-8 text-base text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/pricing">
                    {t.common.viewPricing}
                    <ChevronRight className="ml-2 h-4 w-4 text-primary" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" />{t.marketing.emailSignIn}</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" />{t.marketing.moderation}</span>
                <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-primary" />{t.marketing.privateDesign}</span>
              </motion.div>
            </motion.div>

            <HeroSignalVisual />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="grid gap-3 border-t border-border/60 px-6 py-5 sm:px-10 lg:grid-cols-3 lg:px-14"
          >
            {featureCards.map((item) => (
              <Card key={item.title} className="group border-white/10 bg-white/[0.035] shadow-none transition hover:border-primary/30 hover:bg-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    {item.icon}
                    <span className="rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition group-hover:text-primary">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </motion.div>

          <div className="grid gap-4 border-t border-border/60 px-6 py-5 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-14">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-4 border-white/10 lg:border-r lg:last:border-r-0">
                <span className="text-primary">{item.icon}</span>
                <div>
                  <p className="text-lg font-semibold leading-none">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-gradient-to-b from-secondary/30 to-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {sections.map((item) => (
            <div key={item.title}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item.title}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t.marketing.complianceTitle}</h2>
            <p className="mt-4 text-muted-foreground">
              {t.marketing.complianceBody}
            </p>
            <Separator className="my-8 bg-border/80" />
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {t.marketing.emailSignIn}
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                X OAuth keeps access protected across shared devices.
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Built-in profiles, posts, likes, queues, and admin operations.
              </li>
            </ul>
          </div>
          <Card className="border-border/80 bg-card/60 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle>{t.marketing.installTitle}</CardTitle>
              <CardDescription>{t.marketing.privateDesign}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                {t.marketing.installBody}
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/app">{t.marketing.previewShell}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

