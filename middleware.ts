import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for login, register, and auth API routes
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/register' ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Create response to pass through
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this is critical to prevent session expiry issues
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not authenticated — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
