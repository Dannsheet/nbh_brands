// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Proteger rutas que requieren autenticación
  const protectedRoutes = ['/admin', '/carrito', '/perfil'];
  if (!session && protectedRoutes.some(p => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteger /admin solo para rol 'admin'
  if (session && pathname.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', session.user.id)
      .single();

    if (userData?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Evitar acceso a /login o /registro si ya está autenticado
  const authRoutes = ['/login', '/registro'];
  if (session && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/carrito',
    '/perfil',
    '/login',
    '/registro',
  ],
};
