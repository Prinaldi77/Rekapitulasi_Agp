import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Server Middleware enforcing security & role-based access control policies
 * for the AGP Competition System Single Domain Architecture.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yicrnndbulqahzwzdofw.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpY3JubmRidWxxYWh6d3pkb2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDQxNzMsImV4cCI6MjEwMDIyMDE3M30.PFNutAfJLAzwOPmvezIlPjSyBcCxJ2Yyf_c3O9QgirU';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Fetch current session/user securely via Supabase Auth
  let user: any = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    console.warn('Middleware Supabase auth error (graceful fallback):', err);
  }

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Policy 1 (Unauthenticated Admin Access):
  if (pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // Policy 2: Enforce Role Permission Matrix
    const metaRole = user.user_metadata?.role;
    const email = user.email || '';
    
    let effectiveRole = 'OPERATOR_REKAP';
    if (metaRole === 'SUPER_ADMIN' || metaRole === 'ADMIN' || metaRole === 'OPERATOR_REKAP') {
      effectiveRole = metaRole;
    } else if (email.includes('grandmaster') || email.includes('superadmin')) {
      effectiveRole = 'SUPER_ADMIN';
    } else if (email.includes('admin')) {
      effectiveRole = 'ADMIN';
    }

    // A. Super Admin Routes (restricted from Admin and Operator Rekap)
    const isSuperAdminOnlyRoute = 
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/roles') ||
      pathname.startsWith('/admin/audit-logs') ||
      pathname.startsWith('/admin/backup') ||
      pathname.startsWith('/admin/restore') ||
      pathname.startsWith('/admin/settings');

    if (isSuperAdminOnlyRoute && effectiveRole !== 'SUPER_ADMIN') {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    // B. Allowed routes for Operator Rekap (cannot access barack, schedule, categories, operators, etc.)
    const isAllowedForOperatorRekap = 
      pathname === '/admin' ||
      pathname.startsWith('/admin/score-entry') ||
      pathname.startsWith('/admin/leaderboard') ||
      pathname.startsWith('/admin/profile');

    if (effectiveRole === 'OPERATOR_REKAP' && !isAllowedForOperatorRekap) {
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // Policy 3 (Already Authenticated Login Access):
  if (pathname === '/login' && user) {
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
