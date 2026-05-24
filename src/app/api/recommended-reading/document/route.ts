import { NextResponse } from "next/server";
import { getSupabaseUrl } from "@/lib/env";

const GUTENBERG_HOSTS = new Set(["gutenberg.org", "www.gutenberg.org"]);
const RECOMMENDED_BUCKET_PATH = "/storage/v1/object/public/recommended-documents/";

function isAllowedDocumentUrl(url: URL): boolean {
  if (url.protocol !== "https:") return false;

  if (GUTENBERG_HOSTS.has(url.hostname) && url.pathname.includes("/cache/epub/")) {
    return true;
  }

  const supabaseBase = getSupabaseUrl();
  if (!supabaseBase) return false;

  try {
    const base = new URL(supabaseBase);
    return url.hostname === base.hostname && url.pathname.startsWith(RECOMMENDED_BUCKET_PATH);
  } catch {
    return false;
  }
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

  const upstream = await fetch(source.toString(), {
    cache: "force-cache",
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: "Unable to load document." }, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";

  const isPdf = contentType.includes("pdf");

  return new NextResponse(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": isPdf ? "private, no-store" : "public, max-age=86400",
    },
  });
}
