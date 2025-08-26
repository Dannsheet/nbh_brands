// src/app/api/admin/productos/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const ALLOWED_SORT = new Set(['created_at', 'nombre', 'precio', 'activo']);

const BASE_SELECT = `
  id, nombre, descripcion, precio, slug, activo,
  categoria_id, subcategoria_id,
  es_colaboracion, etiqueta, descuento,
  imagen_url,
  colores, tallas, corte, imagenes,
  created_at
`;

export async function GET(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const url = new URL(req.url);
    const params = url.searchParams;

    const page = parsePositiveInt(params.get('page'), 1);
    const rawLimit = parsePositiveInt(params.get('limit'), DEFAULT_LIMIT);
    const limit = Math.min(rawLimit, MAX_LIMIT);

    const q = params.get('q')?.trim() || null;
    const categoria_id = params.get('categoria_id') || null;
    const subcategoria_id = params.get('subcategoria_id') || null;
    const activo = params.get('activo');
    const sort_by = ALLOWED_SORT.has(params.get('sort_by')) ? params.get('sort_by') : 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = supabaseAdmin.from('productos').select(BASE_SELECT, { count: 'exact' });

    if (categoria_id) query = query.eq('categoria_id', categoria_id);
    if (subcategoria_id) query = query.eq('subcategoria_id', subcategoria_id);
    if (activo === 'true' || activo === 'false') query = query.eq('activo', activo === 'true');

    if (q) {
      query = query.or(`nombre.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    query = query.order(sort_by, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error GET /productos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalizar activo → estado
    const productos = data.map(p => ({
      ...p,
      estado: p.activo ? 'activo' : 'inactivo',
      activo: undefined
    }));
    return NextResponse.json({ productos, total: count ?? productos.length ?? 0 }, { status: 200 });
  } catch (err) {
    console.error('Unexpected Error GET /productos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await req.json();

    const required = ['nombre', 'precio', 'slug'];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        return NextResponse.json({ error: `Falta campo obligatorio: ${k}` }, { status: 400 });
      }
    }

    const payload = {
      nombre: body.nombre,
      descripcion: body.descripcion ?? '',
      precio: Number(body.precio),
      slug: String(body.slug),
      activo: body.activo ?? true,
      categoria_id: body.categoria_id ?? null,
      subcategoria_id: body.subcategoria_id ?? null,
      es_colaboracion: body.es_colaboracion ?? false,
      etiqueta: body.etiqueta ?? null,
      descuento: body.descuento ?? 0,
      imagen_url: body.imagen_url ?? null,
      colores: body.colores ?? null,
      tallas: body.tallas ?? null,
      corte: body.corte ?? null,
      imagenes: body.imagenes ?? null
    };

    const { data, error } = await supabaseAdmin.from('productos').insert([payload]).select(BASE_SELECT).single();
    if (error) {
      console.error('Error POST /productos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Producto creado', data }, { status: 201 });
  } catch (err) {
    console.error('Unexpected Error POST /productos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const allowed = [
      'nombre','descripcion','precio','slug','activo',
      'categoria_id','subcategoria_id',
      'es_colaboracion','etiqueta','descuento',
      'imagen_url','colores','tallas','corte','imagenes'
    ];
    const payload = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    if ('precio' in payload) payload.precio = Number(payload.precio);

    const { data, error } = await supabaseAdmin
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select(BASE_SELECT)
      .single();

    if (error) {
      console.error('Error PATCH /productos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Producto actualizado', data }, { status: 200 });
  } catch (err) {
    console.error('Unexpected Error PATCH /productos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID es obligatorio' }, { status: 400 });

    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id);
    if (error) {
      console.error('Error DELETE /productos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Producto eliminado' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected Error DELETE /productos:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
