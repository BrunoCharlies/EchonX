// @ts-nocheck
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

function supabaseStorageHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseStorageHostname() ?? "bnclzhnkonkmyydjslri.supabase.co";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  /** Next.js dev badge (N) — route/build status in local dev only; not part of EchonX. Hidden to avoid overlap with the library bar. */
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "35mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com", pathname: "/**" },
      { protocol: "https", hostname: "abs.twimg.com", pathname: "/**" },
      { protocol: "https", hostname: "i.pravatar.cc", pathname: "/**" },
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "www.gutenberg.org", pathname: "/cache/**" },
    ],
  },
};

export default withPWA(nextConfig);
