import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authBaseConfig } from '@/lib/auth/auth.config';
import { buildLoginRedirectPath } from '@/lib/auth/auth-routing.helpers';
import { hasSignedInSession, hasValidConsoleSession } from '@/lib/auth/auth-session.helpers';
import { ROUTES } from '@/lib/config/routes';

// Middleware reads the session cookie only, so it uses the edge-safe config.
// The database-backed providers live in src/lib/auth/auth.ts.
const { auth } = NextAuth(authBaseConfig);

export const proxy = auth((request) => {
  const interruptedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (!hasSignedInSession(request.auth)) {
    return NextResponse.redirect(
      new URL(buildLoginRedirectPath(interruptedPath), request.nextUrl.origin)
    );
  }

  if (!hasValidConsoleSession(request.auth)) {
    // Rewrite, not redirect: the operator keeps the address they typed, and
    // the denied page is what they see at that address.
    return NextResponse.rewrite(new URL(ROUTES.forbidden, request.nextUrl.origin));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-path', interruptedPath);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ['/console/:path*'],
};
