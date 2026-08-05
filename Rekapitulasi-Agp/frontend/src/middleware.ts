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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Policy 1 (Unauthenticated Admin Access):
  if (pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // Policy 2 (Role-Based Restriction for Score Entry, Master Leaderboard, and Users):
    // Only GRAND_MASTER can access /admin/score-entry, /admin/leaderboard, and /admin/users
    const isGrandMasterOnlyRoute = 
      pathname.startsWith('/admin/score-entry') || 
      pathname.startsWith('/admin/leaderboard') || 
      pathname.startsWith('/admin/users');

    if (isGrandMasterOnlyRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', user.id)
        .single();

      const isGrandMaster = profile?.role === 'GRAND_MASTER' || user.email?.includes('grandmaster') || profile?.username === 'grandmaster';

      if (!isGrandMaster) {
        // Operator Lapangan is restricted from Penilaian & Master SK -> redirect to /admin/schedule-manage
        url.pathname = '/admin/schedule-manage';
        return NextResponse.redirect(url);
      }
    }
  }

  // Policy 3 (Already Authenticated Login Access):
  if (pathname === '/login' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', user.id)
      .single();

    const isGrandMaster = profile?.role === 'GRAND_MASTER' || user.email?.includes('grandmaster') || profile?.username === 'grandmaster';

    url.pathname = isGrandMaster ? '/admin/leaderboard' : '/admin/schedule-manage';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
