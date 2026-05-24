/**
 * Merge Stripe vars from env/stripe.{live|test}.env into .env.local (other keys unchanged).
 * Usage: node scripts/apply-stripe-env.mjs live|test
 */
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const mode = process.argv[2]?.toLowerCase();

if (mode !== "live" && mode !== "test") {
  console.error("Usage: node scripts/apply-stripe-env.mjs live|test");
  process.exit(1);
}

const stripeKeys = new Set([
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_POPULAR",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_LIBRARY_STARTER",
  "STRIPE_PRICE_LIBRARY_POPULAR",
  "STRIPE_PRICE_LIBRARY_PRO",
  "STRIPE_PRICE_AI_ANALYSIS",
]);

const stripeSourcePath = path.join(root, "env", `stripe.${mode}.env`);
const envLocalPath = path.join(root, ".env.local");
const markerPath = path.join(root, "env", ".stripe-mode");

if (!fs.existsSync(stripeSourcePath)) {
  console.error(`Missing ${stripeSourcePath}`);
  if (mode === "live") {
    console.error("Run: npm run stripe:init  (copies Stripe block from .env.local → env/stripe.live.env)");
  } else {
    console.error(`Copy env/stripe.test.env.example → env/stripe.test.env and fill test keys.`);
  }
  process.exit(1);
}

if (!fs.existsSync(envLocalPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

function parseEnvFile(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    map.set(key, line.slice(idx + 1).trim());
  }
  return map;
}

const stripeMap = parseEnvFile(fs.readFileSync(stripeSourcePath, "utf8"));
const localLines = fs.readFileSync(envLocalPath, "utf8").split(/\r?\n/);
const out = [];
let replaced = 0;

for (const line of localLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    out.push(line);
    continue;
  }
  const idx = line.indexOf("=");
  if (idx <= 0) {
    out.push(line);
    continue;
  }
  const key = line.slice(0, idx).trim();
  if (stripeKeys.has(key)) {
    if (stripeMap.has(key)) {
      out.push(`${key}=${stripeMap.get(key)}`);
      replaced++;
    } else {
      out.push(line);
    }
    continue;
  }
  out.push(line);
}

// Append any stripe keys from source that were missing in .env.local
const existingKeys = new Set(
  out
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => l.slice(0, l.indexOf("=")).trim()),
);

const missing = [...stripeMap.keys()].filter((k) => stripeKeys.has(k) && !existingKeys.has(k));
if (missing.length) {
  out.push("", `# Stripe (${mode}) — appended by apply-stripe-env`);
  for (const key of missing) {
    out.push(`${key}=${stripeMap.get(key)}`);
    replaced++;
  }
}

fs.writeFileSync(envLocalPath, out.join("\n").replace(/\n+$/, "") + "\n", "utf8");
fs.mkdirSync(path.join(root, "env"), { recursive: true });
fs.writeFileSync(markerPath, `${mode}\n`, "utf8");

console.log(`[stripe-env] Applied ${mode} → .env.local (${replaced} Stripe variable(s))`);
console.log(`[stripe-env] Active mode: ${mode} (see env/.stripe-mode)`);
console.log(`[stripe-env] Restart npm run dev. For webhooks: stripe listen --forward-to localhost:3002/api/webhooks/stripe`);
