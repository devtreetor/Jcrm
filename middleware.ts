import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface JWTPayload {
  id: string;
  role: string;
  team_lead_id: string | null;
  exp?: number;
}

const PUBLIC_PATHS = ['/api/auth/login', '/login', '/_next', '/favicon.ico'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  const requiresAuth =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/tl') ||
    pathname.startsWith('/caller');

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('supabase-auth-token')?.value;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    const userPayload = payload as unknown as JWTPayload;

    if (!userPayload.id || !userPayload.role) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/admin') && userPayload.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/tl') && userPayload.role !== 'team_lead') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (pathname.startsWith('/caller') && userPayload.role !== 'caller') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userPayload.id);
    requestHeaders.set('x-user-role', userPayload.role);
    requestHeaders.set('x-user-tl-id', userPayload.team_lead_id ?? '');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    console.error('JWT verification error:', message);

    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/tl/:path*',
    '/caller/:path*',
  ],
};
