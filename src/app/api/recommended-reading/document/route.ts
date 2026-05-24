import { NextResponse } from "next/server";
import { getSupabaseUrl } from "@/lib/env";
import { extractPdfPlainTextFromBuffer } from "@/lib/library/extract-pdf-text-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GUTENBERG_HOSTS = new Set(["gutenberg.org", "www.gutenberg.org"]);
const RECOMMENDED_BUCKET_PATH = "/storage/v1/object/public/recommended-documents/";

function isRecommendedStoragePdf(url: URL) {
  const supabaseBase = getSupabaseUrl();
  if (!supabaseBase) return false;
  try {
    const base = new URL(supabaseBase);
    return url.hostname === base.hostname && url.pathname.startsWith(RECOMMENDED_BUCKET_PATH);
  } catch {
    return false;
  }
}

function isAllowedDocumentUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;

  if (GUTENBERG_HOSTS.has(url.hostname) && url.pathname.includes("/cache/epub/")) {
    return true;
  }

  return isRecommendedStoragePdf(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "Missing document URL." }, { status: 400 });
  }

  let source: URL;
  try {
    source = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid document URL." }, { status: 400 });
  }

  if (!isAllowedDocumentUrl(source)) {
    return NextResponse.json({ error: "Document source is not allowed." }, { status: 400 });
  }

  const extractText = searchParams.get("extract") === "text";

  const upstream = await fetch(source.toString(), {
    cache: extractText ? "no-store" : "force-cache",
    next: extractText ? undefined : { revalidate: 60 * 60 * 24 },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Unable to load document." }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const isPdf =
    contentType.includes("pdf") || source.pathname.toLowerCase().endsWith(".pdf");

  if (extractText) {
    if (!isRecommendedStoragePdf(source) || !isPdf) {
      return NextResponse.json(
        { error: "Text extraction is only available for recommended library PDFs." },
        { status: 400 },
      );
    }

    try {
      const buffer = await upstream.arrayBuffer();
      const text = await extractPdfPlainTextFromBuffer(buffer);
      if (!text.trim()) {
        return NextResponse.json({ error: "No readable text in this PDF." }, { status: 422 });
      }
      return new NextResponse(text, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "private, max-age=3600",
        },
      });
    } catch (error) {
      console.error("[recommended-reading/document] PDF text extract failed", error);
      return NextResponse.json({ error: "Unable to extract text from this PDF." }, { status: 500 });
    }
  }

  return new NextResponse(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": isPdf ? "private, no-store" : "public, max-age=86400",
    },
  });
}
