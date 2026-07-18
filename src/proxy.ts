import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccess, firstAllowedPath, permissionForPath } from '@/lib/permissions';
import type { DashboardPermission, ManagementAccess, ManagementRole } from '@/lib/permissions';

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnLogin = pathname === '/login';

  if (isOnDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isOnDashboard && user && pathname !== '/dashboard/access-denied') {
    const { data } = await supabase
      .from('management_users')
      .select('id, email, display_name, role, permissions')
      .eq('id', user.id)
      .maybeSingle();

    const profile = data as {
      id: string;
      email: string;
      display_name: string | null;
      role: ManagementRole;
      permissions: DashboardPermission[];
    } | null;

    if (!profile) {
      return NextResponse.redirect(new URL('/dashboard/access-denied', request.url));
    }

    const access: ManagementAccess = {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
      permissions: profile.permissions ?? [],
    };
    const requiredPermission = permissionForPath(pathname);
    const allowed = requiredPermission === null
      || (requiredPermission === 'users' ? access.role === 'super_admin' : canAccess(access, requiredPermission));

    if (!allowed) {
      return NextResponse.redirect(new URL(firstAllowedPath(access), request.url));
    }
  }

  if (isOnLogin && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};
