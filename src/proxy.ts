import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

/**
 * The login wall. Every request outside the public list needs a validly
 * signed, unexpired session cookie; everything else bounces to /login.
 *
 * This check is stateless (signature + expiry only). The app shell in
 * src/app/(os)/layout.tsx re-checks the session against the database, so a
 * removed login takes effect on the next page load even with a live cookie.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/seed") || // guarded by its own SETUP_TOKEN
    pathname.startsWith("/_next") ||
    pathname.includes("."); // static assets: logo files, favicon, fonts

  if (isPublic) return NextResponse.next();

  const personId = verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (personId) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}
