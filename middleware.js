import { NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const protectedRoutes = ['/home', '/courses', '/ask', '/text-to-docs', '/admin'];
  const authRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

  // Redirect authenticated users from auth routes to /home
  if (token && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Redirect unauthenticated users from protected routes to /login
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Special handling for admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);

      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/forgot-password', '/reset-password', '/home', '/courses/:path*', '/ask', '/text-to-docs', '/admin/:path*', '/api/schedule', '/api/courses'],
};