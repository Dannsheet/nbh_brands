// src/app/api/admin/inventario/route.js
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

    const q = params.get('q')?.trim() || null; // buscar por nombre de producto
    const producto_id = params.get('producto_id') || null;
    const color = params.get('color') || null;
    const talla = params.get('talla') || null;

    const allowedSort = new Set(['created_at', 'stock', 'color', 'talla']);
    const sort_by = allowedSort.has(params.get('sort_by')) ? params.get('sort_by') : 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabase
      .from('inventario_productos')
      .select('id, producto_id, color, talla, stock, created_at', { count: 'exact' });

    if (producto_id) query = query.eq('producto_id', producto_id);
    if (color) query = query.ilike('color', `%${color}%`);
    if (talla) query = query.eq('talla', talla);

    query = query.order(sort_by, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('❌ Error fetching inventario:', error);
      return NextResponse.json({ error: 'Error al obtener inventario', details: error.message }, { status: 500 });
    }

    const rows = data || [];
    const productoIds = [...new Set(rows.map(r => r.producto_id).filter(Boolean))];

    let productsById = {};
    if (productoIds.length) {
      const { data: prods, error: pErr } = await supabase
        .from('productos')
        .select('id, nombre')
        .in('id', productoIds);
      if (pErr) console.error('Error fetching productos for names:', pErr);
      else productsById = prods.reduce((acc, p) => ((acc[p.id] = p.nombre || null), acc), {});
    }

    // filtro por q (nombre del producto) en memoria
    let filtered = rows.map(r => ({
      id: r.id,
      producto_id: r.producto_id,
      nombre: productsById[r.producto_id] ?? null,
      color: r.color,
      talla: r.talla,
      unidades: r.stock,
      created_at: r.created_at
    }));

    if (q) {
      const qNorm = q.toLowerCase();
      filtered = filtered.filter(x => (x.nombre || '').toLowerCase().includes(qNorm));
    }

    return NextResponse.json({
      data: filtered,
      meta: {
        total: typeof count === 'number' ? count : filtered.length,
        page,
        limit,
        from,
        to
      }
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in GET /api/admin/inventario:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const { producto_id, color, talla, stock } = body;

    if (!producto_id || !color || !talla || typeof stock !== 'number') {
      return NextResponse.json({ error: 'Campos obligatorios: producto_id, color, talla, stock(number)' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inventario_productos')
      .insert([{ producto_id, color, talla, stock }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Inventario agregado', data }, { status: 201 });
  } catch (err) {
    console.error('❌ Error POST /inventario:', err);
    return NextResponse.json({ error: 'Error al crear inventario' }, { status: 500 });
  }
}

export async function PATCH(req) {
  const supabase = createClient();
  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    // Limpiar campos no permitidos
    const allowed = ['producto_id', 'color', 'talla', 'stock'];
    const payload = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Debe proporcionar al menos un campo válido para actualizar' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('inventario_productos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Inventario actualizado', data }, { status: 200 });
  } catch (err) {
    console.error('❌ Error PATCH /inventario:', err);
    return NextResponse.json({ error: 'Error al actualizar inventario' }, { status: 500 });
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

    const { error } = await supabase
      .from('inventario_productos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Inventario eliminado' }, { status: 200 });
  } catch (err) {
    console.error('❌ Error DELETE /inventario:', err);
    return NextResponse.json({ error: 'Error al eliminar inventario' }, { status: 500 });
  }
}
