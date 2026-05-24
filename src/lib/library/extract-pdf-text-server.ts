/**
 * Server-side PDF text extraction for recommended library PDFs (e.g. Qubic whitepaper).
 * Avoids pdf.js in Mobile Safari, where worker/WASM often hangs or fails.
 */
export async function extractPdfPlainTextFromBuffer(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const task = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    useWorkerFetch: false,
    disableFontFace: true,
  });

  const pdf = await task.promise;
  const parts: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (text) parts.push(text);
    }
  } finally {
    await pdf.destroy();
  }

  return parts.join("\n\n");
}
