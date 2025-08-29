// src/lib/admin-auth.js
// src/lib/admin-auth.js
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

const isUUID = v => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

// simple in-memory cache + dedupe
const cache = new Map();
const pending = new Map();
const TTL = 2 * 60 * 1000;

async function fetchUser(token) {
  if (!token) return null;
  const c = cache.get(token);
  if (c && c.expire > Date.now()) return c.user;
  if (pending.has(token)) return pending.get(token);

  const p = (async () => {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) throw error;
    const user = data?.user ?? null;
    cache.set(token, { user, expire: Date.now() + TTL });
    return user;
  })();

  pending.set(token, p);
  try {
    return await p;
  } finally {
    pending.delete(token);
  }
}

export async function checkIsAdminFromCookieStore(cookieStore) {
  try {
    const cookieStoreUsed = cookieStore ?? await cookies();
    const raw = cookieStoreUsed.get?.('sb-bwychvsydhqtjkntqkta-auth-token')?.value
      || cookieStoreUsed.get?.('sb-bwychvsydhqtjkntqkta-auth-token.0')?.value
      || null;
    if (!raw) return { ok: false, status: 401, message: 'No auth token' };

    let token = raw;
    try {
      if (token.startsWith('[')) {
        const parsed = JSON.parse(token);
        token = Array.isArray(parsed) ? parsed[0] : token;
      }
    } catch (e) {
      // keep token as-is
    }

    const user = await fetchUser(token);
    if (!user) return { ok: false, status: 401, message: 'Invalid token' };

    // validate role in usuarios table
    const { data: perfil, error: perfilErr } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .limit(1)
      .maybeSingle();

    if (perfilErr) {
      console.warn('admin-auth: error fetching perfil', perfilErr);
      return { ok: false, status: 500, message: 'Error verificando perfil' };
    }

    const rol = perfil?.rol ?? null;
    const isAdmin = rol === 'admin' || rol === 'superadmin';

    return { ok: true, user, isAdmin };
  } catch (err) {
    console.error('checkIsAdmin error:', err);
    if (err?.status === 429) return { ok: false, status: 429, message: 'Rate limit' };
    return { ok: false, status: 500, message: 'Error verificando admin' };
  }
}
