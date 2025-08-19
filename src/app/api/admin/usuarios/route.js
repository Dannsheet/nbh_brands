// src/app/api/admin/usuarios/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const BASE_SELECT = 'id, nombre, email, rol, created_at';
const ALLOWED_SORT = new Set(['created_at', 'nombre', 'email', 'rol']);

export async function GET(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const q = params.get('q')?.trim() || null; // nombre o email
    const rol = params.get('rol') || null;

    const sort_by = ALLOWED_SORT.has(params.get('sort_by')) ? params.get('sort_by') : 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase.from('usuarios').select(BASE_SELECT, { count: 'exact' });

    if (rol) query = query.eq('rol', rol);
    if (q) query = query.or(`nombre.ilike.%${q}%,email.ilike.%${q}%`);

    query = query.order(sort_by, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      data,
      meta: { total: count ?? data?.length ?? 0, page, limit, from, to }
    }, { status: 200 });
  } catch (err) {
    console.error('❌ Error GET /usuarios:', err);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const { nombre, email, rol } = body;

    if (!nombre || !email || !rol) {
      return NextResponse.json({ error: 'Campos obligatorios: nombre, email, rol' }, { status: 400 });
    }

    const payload = { nombre, email, rol };

    const { data, error } = await supabase.from('usuarios').insert([payload]).select(BASE_SELECT).single();
    if (error) throw error;

    return NextResponse.json({ message: 'Usuario creado', data }, { status: 201 });
  } catch (err) {
    console.error('❌ Error POST /usuarios:', err);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PATCH(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const allowed = ['nombre', 'email', 'rol'];
    const payload = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select(BASE_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Usuario actualizado', data }, { status: 200 });
  } catch (err) {
    console.error('❌ Error PATCH /usuarios:', err);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Usuario eliminado' }, { status: 200 });
  } catch (err) {
    console.error('❌ Error DELETE /usuarios:', err);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
