// src/lib/admin-auth.js
import createClient from '@/lib/supabase/server';

/**
 * checkIsAdmin(req):
 *  - Si hay x-admin-secret y coincide con ADMIN_API_KEY -> OK
 *  - Si hay Bearer token -> valida usuario y rol === 'admin' en tabla `usuarios`
 * Retorna { ok: true } o { ok: false, status, message }
 */
export async function checkIsAdmin(req) {
  // 1) Header secreto (útil para previews en Vercel)
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret && process.env.ADMIN_API_KEY && adminSecret === process.env.ADMIN_API_KEY) {
    return { ok: true };
  }

  // 2) Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, message: 'Missing Authorization token or x-admin-secret' };
  }

  const token = match[1];
  const supabase = createClient();

  try {
    // Validar usuario a partir del token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return { ok: false, status: 401, message: 'Invalid user token' };
    }

    const userId = userData.user.id;

    // Verificar rol en tabla usuarios
    const { data: perfil, error: perfilErr } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('id', userId)
      .maybeSingle();

    if (perfilErr) {
      console.error('Error fetching perfil:', perfilErr);
      return { ok: false, status: 403, message: 'Error verificando permisos' };
    }
    if (!perfil || perfil.rol !== 'admin') {
      return { ok: false, status: 403, message: 'Acceso denegado: se requiere rol admin' };
    }

    return { ok: true };
  } catch (err) {
    console.error('checkIsAdmin error:', err);
    return { ok: false, status: 500, message: 'Error interno verificando admin' };
  }
}
