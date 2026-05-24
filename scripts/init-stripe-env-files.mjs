/**
 * One-time: copy Stripe variables from .env.local → env/stripe.live.env
 */
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const envLocalPath = path.join(root, ".env.local");
const outDir = path.join(root, "env");
const livePath = path.join(outDir, "stripe.live.env");
const testExample = path.join(outDir, "stripe.test.env.example");
const testPath = path.join(outDir, "stripe.test.env");

const stripePrefix = /^(NEXT_PUBLIC_STRIPE_|STRIPE_)/;

if (!fs.existsSync(envLocalPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const lines = fs.readFileSync(envLocalPath, "utf8").split(/\r?\n/);
const stripeLines = [
  "# Stripe LIVE — copied from .env.local. Do not commit (gitignored).",
  "",
];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const key = trimmed.split("=")[0]?.trim();
  if (key && stripePrefix.test(key)) {
    stripeLines.push(line);
  }
}

if (stripeLines.length <= 2) {
  console.error("No Stripe variables found in .env.local");
  process.exit(1);
}

fs.writeFileSync(livePath, stripeLines.join("\n") + "\n", "utf8");
console.log(`[stripe-env] Wrote ${livePath}`);

if (!fs.existsSync(testPath) && fs.existsSync(testExample)) {
  fs.copyFileSync(testExample, testPath);
  console.log(`[stripe-env] Created ${testPath} from example — fill pk_test_/sk_test_/price_ test IDs`);
}

console.log("[stripe-env] Next: edit env/stripe.test.env, then npm run stripe:use-test");
