import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: '/buyer', allowedRoles: ['buyer', 'admin', 'superadmin', 'super_duper_admin'] },
  { prefix: '/seller', allowedRoles: ['seller', 'admin', 'superadmin', 'super_duper_admin'] },
  { prefix: '/admin', allowedRoles: ['admin', 'superadmin', 'super_duper_admin'] },
  { prefix: '/super-admin', allowedRoles: ['superadmin', 'super_duper_admin'] },
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route matches any protected prefix
  const matchedRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.prefix),
  );

  if (matchedRoute) {
    if (!user) {
      const redirectUrl = new URL('/auth/signin', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      const redirectRes = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value);
      });
      return redirectRes;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;
    if (!userRole || !matchedRoute.allowedRoles.includes(userRole)) {
      const redirectUrl = new URL('/auth/signin', request.url);
      const redirectRes = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((cookie) => {
        redirectRes.cookies.set(cookie.name, cookie.value);
      });
      return redirectRes;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|assets/|favicon|site\\.webmanifest|auth/.*\\.html).*)',
  ],
};
