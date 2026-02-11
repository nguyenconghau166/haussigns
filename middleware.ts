import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip checking for the login page itself
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for admin cookie
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession) {
      // Redirect to login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
