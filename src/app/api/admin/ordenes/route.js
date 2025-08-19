// src/app/api/admin/ordenes/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const ALLOWED_SORT = new Set(['fecha', 'total', 'estado']);

export async function GET(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok)
      return NextResponse.json({ error: check.message }, { status: check.status });

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const usuario_id = params.get('usuario_id');
    const estado = params.get('estado');
    const sort_by = ALLOWED_SORT.has(params.get('sort_by'))
      ? params.get('sort_by')
      : 'fecha';
    const order =
      (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('ordenes')
      .select('id, usuario_id, estado, total, fecha', { count: 'exact' });

    if (usuario_id) query = query.eq('usuario_id', usuario_id);
    if (estado) query = query.eq('estado', estado);

    query = query.order(sort_by, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json(
      { data, meta: { total: count ?? data.length, page, limit, from, to } },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error GET /ordenes:', err);
    return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok)
      return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();

    const required = ['usuario_id', 'total'];
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ error: `Falta campo obligatorio: ${k}` }, { status: 400 });
      }
    }

    const payload = {
      usuario_id: body.usuario_id,
      estado: body.estado ?? 'pendiente',
      total: Number(body.total)
    };

    const { data, error } = await supabase
      .from('ordenes')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Orden creada', data }, { status: 201 });
  } catch (err) {
    console.error('❌ Error POST /ordenes:', err);
    return NextResponse.json({ error: 'Error al crear orden' }, { status: 500 });
  }
}

export async function PATCH(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok)
      return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const allowed = ['estado', 'total'];
    const payload = Object.fromEntries(
      Object.entries(rest).filter(([k]) => allowed.includes(k))
    );

    if ('total' in payload) payload.total = Number(payload.total);

    const { data, error } = await supabase
      .from('ordenes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Orden actualizada', data }, { status: 200 });
  } catch (err) {
    console.error('❌ Error PATCH /ordenes:', err);
    return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok)
      return NextResponse.json({ error: check.message }, { status: check.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const { error } = await supabase.from('ordenes').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Orden eliminada' }, { status: 200 });
  } catch (err) {
    console.error('❌ Error DELETE /ordenes:', err);
    return NextResponse.json({ error: 'Error al eliminar orden' }, { status: 500 });
  }
}
