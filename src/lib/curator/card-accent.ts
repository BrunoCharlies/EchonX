const ACCENTS = [
  { from: "#0ea5e9", to: "#0369a1", label: "sky" },
  { from: "#8b5cf6", to: "#5b21b6", label: "violet" },
  { from: "#10b981", to: "#047857", label: "emerald" },
  { from: "#f59e0b", to: "#b45309", label: "amber" },
  { from: "#ef4444", to: "#b91c1c", label: "rose" },
  { from: "#64748b", to: "#334155", label: "slate" },
] as const;

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickCuratorCardAccent(seed: string) {
  return ACCENTS[hashSeed(seed) % ACCENTS.length];
}
