"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mic, Shield, Sparkles, Users } from "lucide-react";
import { SignInWithTwitterButton } from "@/components/auth/sign-in-with-twitter-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-grid opacity-[0.35]" />

      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }} className="max-w-3xl">
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="mb-4 border border-border/80 bg-secondary/60">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" />
              Profile-first · US English · PWA ready
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Hear the people you follow—without the endless feed.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            EchonX is built around profiles, not algorithms. Sign in once with X, craft your native EchonX identity, and
            listen with Supertonic on-device voice that keeps your queue private.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SignInWithTwitterButton size="lg" className="h-12 px-8 text-base" callbackUrl="/app">
              Continue with X
              <ArrowRight className="ml-2 h-4 w-4" />
            </SignInWithTwitterButton>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">
            OAuth 2.0 with PKCE · Automatic moderation on all images · 2 MB smart compression
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 grid gap-6 lg:grid-cols-3"
        >
          <Card className="border-primary/15 bg-gradient-to-b from-card to-card/40">
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle>Profiles are the product</CardTitle>
              <CardDescription>
                There is no general post feed. You discover voices through profiles, tap Want to Hear, and build a
                listening queue that respects your attention.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-accent/20 bg-gradient-to-b from-card to-card/40">
            <CardHeader>
              <Mic className="h-8 w-8 text-accent" />
              <CardTitle>Supertonic on-device</CardTitle>
              <CardDescription>
                Your primary voice runs in the browser with WebAssembly and WebGPU acceleration—ideal for commuters who
                want premium sound without sending every sentence to the cloud.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle>Moderation by default</CardTitle>
              <CardDescription>
                Profile photos and post images pass automatic moderation before they ever become public. Pair that with
                likes, optional Pro audio comments, and crystal-clear plan limits.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </section>

      <section className="border-y border-border/60 bg-gradient-to-b from-secondary/30 to-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { title: "Native profiles", body: "Unlimited, always free to read, always unlimited listening." },
            { title: "External X profiles", body: "Listening limits follow your plan—upgrade when your roster grows." },
            { title: "Fresh posts auto-queue", body: "Only new posts after you subscribe enter the automatic voice queue." },
            { title: "Older posts on demand", body: "Tap Listen to jump back in time without polluting your daily queue." },
          ].map((item) => (
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
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Conversion-focused, compliance-minded.</h2>
            <p className="mt-4 text-muted-foreground">
              Install EchonX as a PWA on iOS or Android, keep Stripe-powered upgrades transparent, and give admins a
              live operational dashboard from day one.
            </p>
            <Separator className="my-8 bg-border/80" />
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                American English copy across marketing and product surfaces.
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                PKCE-protected X login keeps tokens off shared devices.
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Supabase-ready schema for profiles, posts, likes, queues, and Stripe webhooks.
              </li>
            </ul>
          </div>
          <Card className="border-border/80 bg-card/60 shadow-xl shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle>Install in seconds</CardTitle>
              <CardDescription>Add to Home Screen on mobile or install from the desktop banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                EchonX ships with a complete PWA manifest, offline shell, and production-safe image pipelines so your
                community hears you clearly—not loading spinners.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/app">Preview the in-app shell</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
