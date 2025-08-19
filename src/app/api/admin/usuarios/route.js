// src/app/api/admin/usuarios/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

const ALLOWED_SORT_FIELDS = new Set([
  'nombre',
  'email',
  'rol',
  'created_at',
  'id'
]);

function parseIntSafe(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function GET(req) {
  const supabase = createClient();
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parseIntSafe(params.get('page'), 1);
    const rawLimit = parseIntSafe(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const q = params.get('q')?.trim() || null; // búsqueda por nombre o email
    const rol = params.get('rol')?.trim() || null;
    const sort_by = params.get('sort_by') || 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const sortField = ALLOWED_SORT_FIELDS.has(sort_by) ? sort_by : 'created_at';
    const ascending = order === 'asc';

    const baseSelect = `
      id,
      nombre,
      email,
      rol,
      created_at
    `;

    let query = supabase
      .from('usuarios')
      .select(baseSelect, { count: 'exact' });

    if (q) {
      // Buscar por nombre o email
      query = query.or(`nombre.ilike.%${q}%,email.ilike.%${q}%`);
    }

    if (rol) {
      query = query.eq('rol', rol);
    }

    query = query.order(sortField, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching usuarios:', error);
      return NextResponse.json({ error: 'Error al obtener usuarios', details: error.message }, { status: 500 });
    }

    const formatted = (data || []).map(u => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      created_at: u.created_at
    }));

    const total = typeof count === 'number' ? count : formatted.length;

    return NextResponse.json({
      data: formatted,
      meta: { total, page, limit, from, to }
    }, { status: 200 });

  } catch (err) {
    console.error('❌ Unexpected error in /api/admin/usuarios:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: process.env.NODE_ENV === 'development' ? String(err.message || err) : undefined },
      { status: 500 }
    );
  }
}
