import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;
  if (!session && pathname !== "/login" && !pathname.startsWith("/_next") && !pathname.startsWith("/api") && !pathname.startsWith("/auth") && pathname !== "/manifest.json" && pathname !== "/favicon.ico") {
    const url = request.nextUrl.clone(); url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (session && pathname === "/login") {
    const url = request.nextUrl.clone(); url.pathname = "/tasks";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
