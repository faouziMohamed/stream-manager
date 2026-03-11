import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public summary share routes
  if (pathname.startsWith("/s/")) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth/")) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/console", request.url));
    }
    return NextResponse.next();
  }

  // Protect all /console routes
  if (pathname.startsWith("/console")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/console/:path*", "/auth/:path*", "/s/:path*"],
};
