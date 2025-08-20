import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const BASE_SELECT = `
  id, nombre, descripcion, precio, slug, activo,
  categoria_id, subcategoria_id,
  es_colaboracion, etiqueta, descuento,
  imagen_url, colores, tallas, corte, imagenes,
  created_at
`;

/**
 * GET: Obtener un producto específico
 */
export async function GET(req, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Falta ID del producto' }, { status: 400 });

  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { data, error } = await supabaseAdmin
      .from('productos')
      .select(BASE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error GET /productos/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error(`Unexpected Error GET /productos/${id}:`, err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH: Actualizar un producto específico
 */
export async function PATCH(req, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Falta ID del producto' }, { status: 400 });

  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const body = await req.json();

    const allowed = [
      'nombre','descripcion','precio','slug','activo',
      'categoria_id','subcategoria_id',
      'es_colaboracion','etiqueta','descuento',
      'imagen_url','colores','tallas','corte','imagenes'
    ];

    const payload = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    if ('precio' in payload) payload.precio = Number(payload.precio);

    const { data, error } = await supabaseAdmin
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select(BASE_SELECT)
      .single();

    if (error) {
      console.error(`Error PATCH /productos/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Producto actualizado', data }, { status: 200 });
  } catch (err) {
    console.error(`Unexpected Error PATCH /productos/${id}:`, err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * DELETE: Eliminar un producto específico
 */
export async function DELETE(req, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Falta ID del producto' }, { status: 400 });

  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { error } = await supabaseAdmin.from('productos').delete().eq('id', id);
    if (error) {
      console.error(`Error DELETE /productos/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Producto eliminado' }, { status: 200 });
  } catch (err) {
    console.error(`Unexpected Error DELETE /productos/${id}:`, err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
