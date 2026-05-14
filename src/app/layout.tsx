import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://echonx.app"),
  applicationName: "EchonX",
  title: {
    default: "EchonX — Hear the people you follow, on your terms",
    template: "%s · EchonX",
  },
  description:
    "Profile-first social listening for the United States market. Sign in with X, build your native EchonX profile, and listen with premium on-device Supertonic voice.",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://echonx.app",
    siteName: "EchonX",
    title: "EchonX — Profile-first listening",
    description:
      "No endless feed. Follow voices through profiles, queue new posts automatically, and keep control with native EchonX profiles plus optional external X profiles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchonX",
    description:
      "Profile-first social listening with automatic moderation, PWA install, and Supertonic on-device voice.",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050506" },
    { media: "(prefers-color-scheme: light)", color: "#050506" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" className="dark" suppressHydrationWarning>
      <body className={cn("min-h-dvh font-sans", inter.variable, jetbrains.variable)}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
