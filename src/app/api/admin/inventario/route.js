// src/app/api/admin/inventario/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server'; // ajusta si tu helper server-side tiene otro nombre

export const dynamic = 'force-dynamic';

// Ajustes por defecto
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Verifica si la petición la hace un admin:
 * - Si hay Authorization Bearer token: valida con supabase.auth.getUser() y revisa usuarios.rol === 'admin'
 * - Si no hay token, permite un header x-admin-secret que debe igualar process.env.ADMIN_API_KEY (útil en laboratorio).
 *
 * Retorna { ok: true } o { ok: false, status, message }.
 */
async function checkIsAdmin(req, supabase) {
  // 1) header secreto (laboratorio)
  const adminSecret = req.headers.get('x-admin-secret');
  if (adminSecret && process.env.ADMIN_API_KEY && adminSecret === process.env.ADMIN_API_KEY) {
    return { ok: true };
  }

  // 2) Authorization Bearer <token>
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, message: 'Missing Authorization token or x-admin-secret' };

  const token = match[1];
  try {
    // crear cliente con token del usuario (si tu createClient acepta token)
    // Si createClient() requiere token, adapta aquí; asumimos que la función server permite pasar token opcionalmente.
    // Vamos a usar el mismo supabase pero invocaremos auth.getUser usando el token:
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return { ok: false, status: 401, message: 'Invalid user token' };
    }
    const user = userData.user;

    // verificar rol en tabla usuarios
    const { data: perfil, error: perfilErr } = await supabase
      .from('usuarios')
      .select('id, rol')
      .eq('id', user.id)
      .maybeSingle();

    if (perfilErr) {
      console.error('Error fetching perfil:', perfilErr);
      // no asumir admin si falla
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

export async function GET(req) {
  const supabase = createClient(); // debe ser server-side
  try {
    // Verificar permisos (opcional, recomendado)
    const check = await checkIsAdmin(req, supabase);
    if (!check.ok) {
      return NextResponse.json({ error: check.message || 'No autorizado' }, { status: check.status || 401 });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const q = params.get('q')?.trim() || null; // búsqueda libre (por ejemplo por nombre de producto, manejado después)
    const producto_id = params.get('producto_id') || null;
    const color = params.get('color') || null;
    const talla = params.get('talla') || null;

    // ordenamiento seguro — solo columnas permitidas
    const allowedSort = new Set(['created_at', 'stock', 'color', 'talla']);
    const sort_by = allowedSort.has(params.get('sort_by')) ? params.get('sort_by') : 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // construir consulta base
    let query = supabase
      .from('inventario_productos')
      .select('id, producto_id, color, talla, stock, created_at', { count: 'exact' });

    if (producto_id) query = query.eq('producto_id', producto_id);
    if (color) query = query.ilike('color', `%${color}%`);
    if (talla) query = query.eq('talla', talla);

    // nota: q puede buscar por nombre del producto -> lo aplicamos después con join batch
    // ordenar y paginar
    query = query.order(sort_by, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('❌ Error fetching inventory:', error);
      return NextResponse.json({ error: 'Error al obtener inventario', details: error.message }, { status: 500 });
    }

    const rows = data || [];

    // Si hay búsqueda por nombre (q) o si queremos añadir nombre del producto, batch fetch products
    const productoIds = [...new Set(rows.map(r => r.producto_id).filter(Boolean))];
    let productsById = {};
    if (productoIds.length) {
      const pQuery = supabase
        .from('productos')
        .select('id, nombre')
        .in('id', productoIds);
      // Si q está presente y user quiere filtrar por nombre, lo aplicaremos a la lista de productos
      if (q) {
        // no podemos filtrar en la subquery in(); hacemos fetch y luego filtramos en JS por nombre
        const { data: prodsAll, error: pErr } = await pQuery;
        if (pErr) {
          console.error('Error fetching productos for names:', pErr);
        } else {
          // filtrar por q en nombre y convertir a mapa
          const prodsFiltered = prodsAll.filter(p => p.nombre && p.nombre.toLowerCase().includes(q.toLowerCase()));
          const allowedIds = new Set(prodsFiltered.map(p => p.id));
          // filtrar rows por producto_id permitido
          rows.forEach(r => {
            if (!allowedIds.has(r.producto_id)) r._excluded_by_q = true;
          });
          productsById = prodsAll.reduce((acc, p) => {
            acc[p.id] = p.nombre;
            return acc;
          }, {});
        }
      } else {
        const { data: prods, error: pErr } = await pQuery;
        if (pErr) console.error('Error fetching productos for names:', pErr);
        else productsById = prods.reduce((acc, p) => ((acc[p.id] = p.nombre), acc), {});
      }
    }

    // Formatear resultado y remover los que fueron excluidos por q (si aplica)
    const formatted = rows
      .filter(r => !r._excluded_by_q)
      .map(r => ({
        id: r.id,
        producto_id: r.producto_id,
        nombre: productsById[r.producto_id] ?? null,
        color: r.color,
        talla: r.talla,
        unidades: r.stock,
        created_at: r.created_at
      }));

    return NextResponse.json({
      data: formatted,
      meta: {
        total: typeof count === 'number' ? count : formatted.length,
        page,
        limit,
        from,
        to
      }
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in /api/admin/inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor', details: process.env.NODE_ENV === 'development' ? String(err) : undefined }, { status: 500 });
  }
}
