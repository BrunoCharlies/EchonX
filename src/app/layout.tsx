import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { EchonxThemeProvider } from "@/components/theme/echonx-theme-provider";
import { EchonxThemeScript } from "@/components/theme/echonx-theme-script";
import { getServerLocale } from "@/lib/i18n/server";
import { auth } from "@/auth";
import {
  resolveSiteOgImagePath,
  SITE_OG_IMAGE_SIZE,
  SITE_SOCIAL_DESCRIPTION,
  SITE_SOCIAL_TITLE,
} from "@/lib/seo/social-share";

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

function buildMetadata(): Metadata {
  const ogImageUrl = resolveSiteOgImagePath();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://echonx.app"),
    applicationName: "EchonX",
    title: {
      default: "EchonX — Hear the people you follow, on your terms",
      template: "%s · EchonX",
    },
    description:
      "Profile-first social listening for the United States market. Sign in with X, build your native EchonX profile, and listen with premium on-device audio.",
    manifest: "/manifest.json",
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://echonx.app",
      siteName: "EchonX",
      title: SITE_SOCIAL_TITLE,
      description: SITE_SOCIAL_DESCRIPTION,
      images: [
        {
          url: ogImageUrl,
          width: SITE_OG_IMAGE_SIZE.width,
          height: SITE_OG_IMAGE_SIZE.height,
          alt: SITE_SOCIAL_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_SOCIAL_TITLE,
      description: SITE_SOCIAL_DESCRIPTION,
      images: [ogImageUrl],
    },
    icons: {
      icon: [{ url: "/brand/echonx-favicon.png", type: "image/png" }],
      apple: [{ url: "/brand/echonx-favicon.png", type: "image/png" }],
    },
  };
}

export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050506" },
    { media: "(prefers-color-scheme: light)", color: "#050506" },
  ],
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const session = await auth();
  const userId = session?.user.id ?? null;
  const isAdmin = session?.user.role === "admin";
  return (
    <html
      lang={locale}
      className="dark"
      suppressHydrationWarning
      data-user-id={userId ?? ""}
      data-is-admin={isAdmin ? "1" : "0"}
    >
      <body className={cn("min-h-dvh font-sans", inter.variable, jetbrains.variable)}>
        <EchonxThemeScript />
        <EchonxThemeProvider userId={userId} isAdmin={isAdmin}>
          <AppProviders>{children}</AppProviders>
        </EchonxThemeProvider>
      </body>
    </html>
  );
}
