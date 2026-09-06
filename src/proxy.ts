import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
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
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/revision") ||
    nextUrl.pathname.startsWith("/planner") ||
    nextUrl.pathname.startsWith("/projects") ||
    nextUrl.pathname.startsWith("/certificates") ||
    nextUrl.pathname.startsWith("/community") ||
    nextUrl.pathname.startsWith("/courses") ||
    nextUrl.pathname.startsWith("/events") ||
    nextUrl.pathname.startsWith("/host") ||
    nextUrl.pathname.startsWith("/messages") ||
    nextUrl.pathname.startsWith("/notifications") ||
    nextUrl.pathname.startsWith("/ppt") ||
    nextUrl.pathname.startsWith("/prototype") ||
    nextUrl.pathname.startsWith("/referrals") ||
    nextUrl.pathname.startsWith("/research") ||
    nextUrl.pathname.startsWith("/teacher") ||
    nextUrl.pathname.startsWith("/user") ||
    nextUrl.pathname.startsWith("/wallet") ||
    nextUrl.pathname.startsWith("/youtube-summarizer");

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

export default proxy;

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
