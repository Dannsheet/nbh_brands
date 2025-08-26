// src/lib/admin-auth.js
import createClient from '@/lib/supabase/server';

/**
 * checkIsAdmin(req):
 *  - Si hay x-admin-secret y coincide con ADMIN_API_KEY -> OK
 *  - Si hay Bearer token -> valida usuario y rol === 'admin' en tabla `usuarios`
 * Retorna { ok: true } o { ok: false, status, message }
 */
export async function checkIsAdmin(req) {
  try {
    // 1. x-admin-secret
    const adminSecret = req.headers.get('x-admin-secret');
    if (adminSecret && process.env.ADMIN_API_KEY && adminSecret === process.env.ADMIN_API_KEY) {
      console.log('DEBUG admin-auth: x-admin-secret OK');
      return { ok: true };
    }

    // 2. Authorization header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let token = null;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 3. Cookie header (tolerante)
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      console.log('DEBUG admin-auth headers:', {
        authHeader: authHeader?.slice(0, 80),
        cookieHeader: cookieHeader.slice(0, 200)
      });
      if (cookieHeader) {
        // Buscar todas las keys sb-...-auth-token(.0)?
        const cookies = Object.fromEntries(
          cookieHeader.split(';').map(s => {
            const [k, ...rest] = s.trim().split('=');
            return [k, decodeURIComponent(rest.join('='))];
          })
        );
        // Buscar la key más relevante (sb-...-auth-token o variantes)
        let cookieKey = Object.keys(cookies).find(k =>
          k.startsWith('sb-') &&
          (k.includes('auth-token') || k.includes('access-token') || k.includes('token'))
        ) || Object.keys(cookies).find(k => /auth-token|access-token|sb-/i.test(k));
        if (!cookieKey) {
          // Buscar sufijos .0
          cookieKey = Object.keys(cookies).find(k => k.startsWith('sb-') && k.endsWith('.0'));
        }
        if (cookieKey) token = cookies[cookieKey];
      }
    }

    // 4. Limpieza y parseo del token
    if (token) {
      token = decodeURIComponent(token);
      if (token.startsWith('[')) {
        try {
          const arr = JSON.parse(token);
          if (Array.isArray(arr)) token = arr[0];
        } catch {}
      } else if (token.startsWith('{')) {
        try {
          const obj = JSON.parse(token);
          token = obj.access_token || obj.token || token;
        } catch {}
      } else if (token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }
    }

    console.log('DEBUG admin-auth token:', token?.slice?.(0, 60));
    if (!token) return { ok: false, status: 401, message: 'Missing Authorization token or x-admin-secret' };

    // 5. Validar token con supabaseAdmin
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.getUser(token);
    if (getUserError || !userData?.user) {
      console.error('checkIsAdmin: supabase getUser error', getUserError);
      return { ok: false, status: 401, message: 'Token inválido' };
    }

    // 6. Validar rol en tabla usuarios
    const { data: perfil, error: perfilErr } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', userData.user.id)
      .single();
    if (perfilErr) {
      console.error('Error fetching perfil:', perfilErr);
      return { ok: false, status: 403, message: 'Error verificando permisos' };
    }
    if (!perfil || perfil.rol !== 'admin') {
      return { ok: false, status: 403, message: 'Acceso denegado: se requiere rol admin' };
    }
    console.log('DEBUG admin-auth token ok for user:', userData.user.id);
    return { ok: true };
  } catch (err) {
    console.error('checkIsAdmin error:', err);
    return { ok: false, status: 500, message: 'Error interno verificando admin' };
  }
}
