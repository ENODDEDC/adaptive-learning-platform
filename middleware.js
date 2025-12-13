import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Skip middleware for API routes except those explicitly listed
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/schedule') && !pathname.startsWith('/api/courses') && !pathname.startsWith('/api/notifications')) {
    return response;
  }

  const protectedRoutes = ['/home', '/courses', '/ask', '/text-to-docs', '/admin', '/forms', '/submissions'];
  const authRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const publicRoutes = ['/verify-otp'];

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // Redirect authenticated users from auth routes to /home
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect unauthenticated users from protected routes to /login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    // Don't redirect admin routes to regular login
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token for protected routes
  if (token && protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);

      // Special handling for admin routes
      if (pathname.startsWith('/admin')) {
        if (payload.role !== 'admin' && payload.role !== 'super admin') {
          return NextResponse.redirect(new URL('/home', request.url));
        }
      }

      // Token is valid, continue
      return response;
    } catch (error) {
      // Token is invalid or expired, clear it and redirect to login
      const redirectResponse = NextResponse.redirect(
        new URL(pathname.startsWith('/admin') ? '/admin/login' : '/login', request.url)
      );
      redirectResponse.cookies.delete('token');
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password/:path*',
    '/verify-otp',
    '/home',
    '/courses/:path*',
    '/ask',
    '/text-to-docs',
    '/admin/:path*',
    '/forms/:path*',
    '/submissions/:path*',
    '/api/schedule',
    '/api/courses',
    '/api/notifications',
  ],
};