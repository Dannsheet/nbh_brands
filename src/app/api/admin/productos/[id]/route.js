// src/app/api/admin/productos/[id]/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const supabase = createClient();
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        id, nombre, descripcion, precio, slug, activo,
        categoria_id, subcategoria_id, es_colaboracion, etiqueta,
        descuento, created_at, imagen_url, colores, tallas, corte, imagenes
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching producto:', error);
      return NextResponse.json({ error: 'Error al obtener producto', details: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in GET /api/admin/productos/[id]:', err);
    return NextResponse.json({ error: 'Error interno', details: process.env.NODE_ENV === 'development' ? String(err) : undefined }, { status: 500 });
  }
}
