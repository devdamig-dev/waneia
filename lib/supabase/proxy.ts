import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // The status route exposes only public setup diagnostics before authentication;
  // its handler verifies the user and workspace role before returning any account.
  if (request.method === "GET" && pathname === "/api/meta/embedded-signup") return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/api/whatsapp/webhook");

  if (!claims && !isPublic) {
    if (pathname.startsWith("/api/meta/")) {
      return NextResponse.json({
        ok: false,
        error: { code: "AUTHENTICATION_REQUIRED", message: "Iniciá sesión en Waneia para conectar WhatsApp." },
        reason: "Iniciá sesión en Waneia para conectar WhatsApp.",
      }, { status: 401, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (claims && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
