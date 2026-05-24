/**
 * Single route tree under src/app/app — avoids duplicate flat + group routes (ChunkLoadError).
 * - (audiopost)/page.tsx  → /app
 * - (standard)/*          → /app/explore, settings, …
 */
const fs = require("fs");
const path = require("path");

const appDir = path.join(__dirname, "..", "src", "app", "app");
const audiopostDir = path.join(appDir, "(audiopost)");
const standardDir = path.join(appDir, "(standard)");

const hasAudiopost = fs.existsSync(path.join(audiopostDir, "page.tsx"));
const hasStandard = fs.existsSync(standardDir);

if (hasAudiopost) {
  const flatHome = path.join(appDir, "page.tsx");
  if (fs.existsSync(flatHome)) {
    fs.rmSync(flatHome, { force: true });
    console.log("[ensure-app-routes] removed duplicate flat page.tsx");
  }
}

if (hasStandard) {
  for (const segment of ["explore", "discover", "onboarding", "settings"]) {
    const flat = path.join(appDir, segment);
    const grouped = path.join(standardDir, segment);
    if (fs.existsSync(flat) && fs.existsSync(grouped)) {
      fs.rmSync(flat, { recursive: true, force: true });
      console.log(`[ensure-app-routes] removed duplicate flat /${segment}`);
    }
  }
}

// Legacy cleanup: old script deleted route groups — remove if flat copies exist without groups
for (const name of ["(audiopost)", "(standard)"]) {
  const group = path.join(appDir, name);
  if (!fs.existsSync(group)) continue;
  if (name === "(audiopost)" && hasAudiopost) continue;
  if (name === "(standard)" && hasStandard) continue;
}
