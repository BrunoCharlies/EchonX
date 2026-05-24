/** Copies pdf.js worker to /public for Next.js (avoids import.meta.url in client bundles). */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

if (!fs.existsSync(src)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found — run npm install");
  process.exit(0);
}

fs.copyFileSync(src, dest);
console.log("[copy-pdf-worker] public/pdf.worker.min.mjs");
