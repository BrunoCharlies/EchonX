/** Admin-only sandboxes — isolated from production `/app` UI until promoted. */

export type DevLabEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
  status: "active" | "planned";
};

export const DEV_LAB_ENTRIES: DevLabEntry[] = [
  {
    slug: "voice",
    title: "Voice development",
    description:
      "Copy of the Audiopost player stack (queue TTS, rate, language, voices). Experiment here before changing /app.",
    href: "/admin/lab/voice",
    status: "active",
  },
  {
    slug: "library-search",
    title: "Library search (planned)",
    description: "Gutenberg search ranking, covers, and play proxy — future sandbox.",
    href: "/admin/lab",
    status: "planned",
  },
];
