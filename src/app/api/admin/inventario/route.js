// src/app/api/admin/inventario/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

// GET con ordenamiento múltiple y paginación
export async function GET(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const sortByParam = params.get('sort_by');

    let query = supabaseAdmin
      .from('inventario_productos')
      .select(`
        id, stock, color, talla, created_at,
        producto:productos (id, nombre)
      `, { count: 'exact' });

    if (sortByParam) {
      const sortFields = sortByParam.split(',');
      sortFields.forEach(field => {
        const [relatedTable, relatedField] = field.includes('.') ? field.split('.') : [null, field];
        if (relatedTable) {
          query = query.order(relatedField, { ascending: order === 'asc', foreignTable: relatedTable });
        } else {
          query = query.order(field, { ascending: order === 'asc' });
        }
      });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error GET /inventario:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data, meta: { total: count ?? 0, page, limit, from, to } },
      { status: 200 }
    );

  } catch (err) {
    console.error('Unexpected Error GET /inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST para crear un nuevo item de inventario
export async function POST(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await req.json();

    const required = ['producto_id', 'color', 'talla', 'stock'];
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ error: `Falta campo obligatorio: ${k}` }, { status: 400 });
      }
    }

    const payload = {
      producto_id: body.producto_id,
      color: body.color,
      talla: body.talla,
      stock: Number(body.stock ?? 0)
    };

    const { data, error } = await supabaseAdmin
      .from('inventario_productos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error POST /inventario:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Inventario agregado', data }, { status: 201 });

  } catch (err) {
    console.error('Unexpected Error POST /inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH para actualizar un item de inventario
export async function PATCH(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const allowed = ['color', 'talla', 'stock'];
    const payload = Object.fromEntries(
      Object.entries(rest).filter(([k]) => allowed.includes(k))
    );

    if ('stock' in payload) payload.stock = Number(payload.stock);

    const { data, error } = await supabaseAdmin
      .from('inventario_productos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error PATCH /inventario:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Inventario actualizado', data }, { status: 200 });

  } catch (err) {
    console.error('Unexpected Error PATCH /inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE para eliminar un item de inventario
export async function DELETE(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const { error } = await supabaseAdmin.from('inventario_productos').delete().eq('id', id);
    
    if (error) {
      console.error('Error DELETE /inventario:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Inventario eliminado' }, { status: 200 });

  } catch (err) {
    console.error('Unexpected Error DELETE /inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
