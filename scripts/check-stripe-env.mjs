import fs from "fs";
import Stripe from "stripe";

const envPath = ".env.local";
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx <= 0 || line.startsWith("#")) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const checks = [
  ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
  ["STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET],
  [
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY,
  ],
  ["STRIPE_PRICE_STARTER", env.STRIPE_PRICE_STARTER],
  ["STRIPE_PRICE_POPULAR", env.STRIPE_PRICE_POPULAR],
  ["STRIPE_PRICE_PRO", env.STRIPE_PRICE_PRO],
  ["STRIPE_PRICE_LIBRARY_STARTER", env.STRIPE_PRICE_LIBRARY_STARTER],
  ["STRIPE_PRICE_LIBRARY_POPULAR", env.STRIPE_PRICE_LIBRARY_POPULAR],
  ["STRIPE_PRICE_LIBRARY_PRO", env.STRIPE_PRICE_LIBRARY_PRO],
];

console.log("=== Stripe env (.env.local + process) ===\n");
for (const [name, val] of checks) {
  const set = Boolean(val?.trim());
  const hint = set
    ? `${val.trim().slice(0, 8)}… (${val.trim().length} chars)`
    : "MISSING";
  console.log(`${name}: ${set ? "OK" : "—"} ${hint}`);
}

const audiopostCheckout =
  env.STRIPE_SECRET_KEY?.trim() &&
  env.STRIPE_PRICE_STARTER?.trim() &&
  env.STRIPE_PRICE_POPULAR?.trim() &&
  env.STRIPE_PRICE_PRO?.trim();

const libraryCheckout =
  env.STRIPE_SECRET_KEY?.trim() &&
  env.STRIPE_PRICE_LIBRARY_STARTER?.trim() &&
  env.STRIPE_PRICE_LIBRARY_POPULAR?.trim() &&
  env.STRIPE_PRICE_LIBRARY_PRO?.trim();

const webhookReady = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());

console.log("\n=== App flags (stripe-config.ts) ===");
console.log(`Audiopost checkout UI: ${audiopostCheckout ? "YES" : "NO"}`);
console.log(`Library checkout UI: ${libraryCheckout ? "YES" : "NO"}`);
console.log(`Webhook (plan sync after pay): ${webhookReady ? "YES" : "NO — add STRIPE_WEBHOOK_SECRET"}`);

const secret = env.STRIPE_SECRET_KEY?.trim();
if (!secret) {
  console.log("\n=== API test ===\nSkipped (no STRIPE_SECRET_KEY)");
  process.exit(0);
}

console.log("\n=== Stripe API (account retrieve) ===");
try {
  const stripe = new Stripe(secret);
  const account = await stripe.accounts.retrieve();
  const mode = secret.startsWith("sk_live") ? "live" : "test";
  console.log(`Connection: OK (${mode} mode)`);
  console.log(`Account id: ${account.id}`);
  console.log(`Country: ${account.country ?? "n/a"}`);
} catch (err) {
  console.log(`Connection: FAILED`);
  console.log(err instanceof Error ? err.message : String(err));
  process.exit(1);
}
