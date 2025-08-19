// src/app/api/admin/productos/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server'; // ajusta si tu helper se llama distinto

export const dynamic = 'force-dynamic';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

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
    const q = params.get('q')?.trim() || null;
    const estado = params.get('activo'); // filtro exacto: 'true'/'false'
    const sort_by = params.get('sort_by') || 'created_at';
    const order = (params.get('order') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // select fields conocidos (basados en tu schema)
    const select = [
      'id',
      'nombre',
      'descripcion',
      'precio',
      'slug',
      'activo',
      'categoria_id',
      'subcategoria_id',
      'es_colaboracion',
      'etiqueta',
      'descuento',
      'created_at',
      'imagen_url',
      'colores',
      'tallas',
      'corte',
      'imagenes'
    ].join(', ');

    let query = supabase.from('productos').select(select, { count: 'exact' });

    if (q) {
      // buscar por nombre o descripcion
      query = query.or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`);
    }

    if (estado !== null) {
      // Supabase recibe booleano real; aceptamos 'true'/'false' strings
      const bool = estado === 'true' || estado === '1';
      query = query.eq('activo', bool);
    }

    // ordenar (asegúrate que sort_by exista; usamos created_at por defecto)
    // para mayor robustez, solo permitimos ordenar por estas columnas
    const allowedSort = new Set(['created_at', 'precio', 'nombre', 'descuento']);
    const orderCol = allowedSort.has(sort_by) ? sort_by : 'created_at';
    query = query.order(orderCol, { ascending: order === 'asc' });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching productos:', error);
      return NextResponse.json({ error: 'Error al obtener productos', details: error.message }, { status: 500 });
    }

    const rows = (data || []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      slug: p.slug,
      activo: p.activo,
      categoria_id: p.categoria_id,
      subcategoria_id: p.subcategoria_id,
      es_colaboracion: p.es_colaboracion,
      etiqueta: p.etiqueta,
      descuento: p.descuento,
      created_at: p.created_at,
      imagen_url: p.imagen_url,
      colores: p.colores,
      tallas: p.tallas,
      corte: p.corte,
      imagenes: p.imagenes,
      raw: p // opcional para debugging
    }));

    return NextResponse.json({
      data: rows,
      meta: { total: typeof count === 'number' ? count : rows.length, page, limit, from, to }
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in /api/admin/productos:', err);
    return NextResponse.json({ error: 'Error interno del servidor', details: process.env.NODE_ENV === 'development' ? String(err.message || err) : undefined }, { status: 500 });
  }
}
