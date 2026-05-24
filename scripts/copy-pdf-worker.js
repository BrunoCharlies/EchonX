/** Copies pdf.js worker to /public for Next.js (avoids import.meta.url in client bundles). */
const fs = require("fs");
const path = require("path");

const modernSrc = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const legacySrc = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "legacy",
  "build",
  "pdf.worker.min.mjs",
);
const publicDir = path.join(__dirname, "..", "public");

if (!fs.existsSync(modernSrc)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found — run npm install");
  process.exit(0);
}

fs.copyFileSync(modernSrc, path.join(publicDir, "pdf.worker.min.mjs"));
console.log("[copy-pdf-worker] public/pdf.worker.min.mjs");

if (fs.existsSync(legacySrc)) {
  fs.copyFileSync(legacySrc, path.join(publicDir, "pdf.worker.legacy.min.mjs"));
  console.log("[copy-pdf-worker] public/pdf.worker.legacy.min.mjs");
}
