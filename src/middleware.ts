import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function middleware(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app/p/")) {
    const username = pathname.replace("/app/p/", "");
    if (username) {
      const redirect = NextResponse.redirect(new URL(`/u/${encodeURIComponent(username)}`, request.nextUrl));
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const raw = request.nextUrl.searchParams.get("callbackUrl") ?? "/app/explore";
    const target = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app/explore";
    const redirect = NextResponse.redirect(new URL(target, request.nextUrl));
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname.startsWith("/profile");

  if (isProtected && !user) {
    const signInUrl = new URL("/login", request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(signInUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (pathname.startsWith("/admin") && user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (data?.role !== "admin") {
      const redirect = NextResponse.redirect(new URL("/app", request.nextUrl));
      copyCookies(supabaseResponse, redirect);
      return redirect;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
