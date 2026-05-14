import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/app/p/")) {
    const username = pathname.replace("/app/p/", "");
    if (username) {
      return NextResponse.redirect(new URL(`/u/${encodeURIComponent(username)}`, req.nextUrl));
    }
  }

  if (!req.auth) {
    // Auth.js v5: GET /api/auth/signin/twitter is invalid (UnknownAction). Use the built-in
    // sign-in page, or client signIn("twitter"). Middleware must redirect here.
    const signIn = new URL("/api/auth/signin", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  }

  if (pathname.startsWith("/admin")) {
    if (req.auth.user?.role !== "admin") {
      return NextResponse.redirect(new URL("/app", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/profile", "/profile/:path*"],
};
