/**
 * Ensures `.env.local` has a strong AUTH_SECRET (>= 32 chars) before `npm run dev`.
 * Does not print secret values.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function generateSecret() {
  return crypto.randomBytes(32).toString("base64url");
}

function stripQuotes(s) {
  return s.trim().replace(/^["']|["']$/g, "");
}

function main() {
  let body = "";
  if (fs.existsSync(envPath)) {
    body = fs.readFileSync(envPath, "utf8");
  }

  const lines = body.split(/\r?\n/);
  let idx = -1;
  let currentVal = "";

  for (let i = 0; i < lines.length; i++) {
    const m = /^AUTH_SECRET\s*=\s*(.*)$/i.exec(lines[i]);
    if (m) {
      idx = i;
      currentVal = stripQuotes(m[1] ?? "");
      break;
    }
  }

  if (idx >= 0 && currentVal.length >= 32 && !/echonx-(local|dev)/i.test(currentVal)) {
    console.log("[ensure-auth-local] AUTH_SECRET already present with sufficient length.");
    return;
  }

  const secret = generateSecret();
  const newLine = `AUTH_SECRET=${secret}`;

  if (idx < 0) {
    const prefix = body.length && !body.endsWith("\n") ? `${body}\n` : body;
    fs.writeFileSync(envPath, `${prefix}${newLine}\n`, "utf8");
    console.log("[ensure-auth-local] Appended AUTH_SECRET to .env.local.");
    return;
  }

  lines[idx] = newLine;
  let out = lines.join("\n");
  if (!out.endsWith("\n")) out += "\n";
  fs.writeFileSync(envPath, out, "utf8");
  console.log("[ensure-auth-local] Wrote new AUTH_SECRET to .env.local.");
}

main();
