import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup");
  const isDashboardPage =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/notes") ||
    nextUrl.pathname.startsWith("/chat") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/doubts") ||
    nextUrl.pathname.startsWith("/forums") ||
    nextUrl.pathname.startsWith("/blogs") ||
    nextUrl.pathname.startsWith("/bookmarks") ||
    nextUrl.pathname.startsWith("/leaderboard") ||
    nextUrl.pathname.startsWith("/admin");

  if (isDashboardPage) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
