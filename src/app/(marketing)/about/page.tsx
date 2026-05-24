import type { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/about-page-content";

export const metadata: Metadata = {
  title: "About EchonX",
  description:
    "Every voice starts on X. Learn how EchonX helps creators and listeners connect through profile-first audio.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
