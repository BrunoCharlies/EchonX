import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["gutenberg.org", "www.gutenberg.org"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing source URL." }, { status: 400 });
  }

  let source: URL;
  try {
    source = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid source URL." }, { status: 400 });
  }

  if (source.protocol !== "https:" || !ALLOWED_HOSTS.has(source.hostname)) {
    return NextResponse.json({ error: "Source is not allowed." }, { status: 400 });
  }

  const response = await fetch(source, { cache: "force-cache", next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) {
    return NextResponse.json({ error: "Unable to load source." }, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
