import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {getSessionCookie} from 'better-auth/cookies';

export async function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;

    // Allow public summary share routes
    if (pathname.startsWith('/s/')) {
        return NextResponse.next();
    }

    // Protect all /console routes
    if (pathname.startsWith('/console')) {
        const sessionCookie = getSessionCookie(request);

        if (!sessionCookie) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Role check is handled in individual pages/resolvers via server-side session
        // Middleware only checks that a session exists (cookie present)
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/console/:path*',
        '/s/:path*',
    ],
};
