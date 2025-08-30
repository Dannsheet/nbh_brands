// src/app/api/admin/ordenes/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdminFromCookieStore } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const ALLOWED_SORT = new Set(['fecha', 'total', 'estado', 'usuarios.nombre', 'usuarios.email']);

export async function GET(req) {
  try {
    const auth = await checkIsAdminFromCookieStore(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const usuario_id = params.get('usuario_id');
    const estado = params.get('estado');
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortByParam = params.get('sort_by');

    let query = supabaseAdmin
      .from('ordenes')
      .select('id, usuario_id, estado, total, fecha, usuario:usuarios(nombre, email)', { count: 'exact' });

    if (usuario_id) query = query.eq('usuario_id', usuario_id);
    if (estado) query = query.eq('estado', estado);

    if (sortByParam) {
      const sortFields = sortByParam.split(',');
      sortFields.forEach(field => {
        const [relatedTable, relatedField] = field.includes('.') ? field.split('.') : [null, field];
        if (relatedTable && ALLOWED_SORT.has(field)) {
          query = query.order(relatedField, { ascending: order === 'asc', foreignTable: relatedTable });
        } else if (ALLOWED_SORT.has(field)) {
          query = query.order(field, { ascending: order === 'asc' });
        }
      });
    } else {
      query = query.order('fecha', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error GET /ordenes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data, meta: { total: count ?? data.length, page, limit, from, to } },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected Error GET /ordenes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await checkIsAdminFromCookieStore(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

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

    const { data, error } = await supabaseAdmin
      .from('ordenes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error POST /ordenes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Orden creada', data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected Error POST /ordenes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await checkIsAdminFromCookieStore(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const allowed = ['estado', 'total'];
    const payload = Object.fromEntries(
      Object.entries(rest).filter(([k]) => allowed.includes(k))
    );

    if ('total' in payload) payload.total = Number(payload.total);

    const { data, error } = await supabaseAdmin
      .from('ordenes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error PATCH /ordenes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Orden actualizada', data }, { status: 200 });
  } catch (err) {
    console.error('Unexpected Error PATCH /ordenes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await checkIsAdminFromCookieStore(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const { error } = await supabaseAdmin.from('ordenes').delete().eq('id', id);
    
    if (error) {
      console.error('Error DELETE /ordenes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Orden eliminada' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected Error DELETE /ordenes:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
