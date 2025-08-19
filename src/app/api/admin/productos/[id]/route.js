// src/app/api/admin/productos/[id]/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
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
  const supabase = createClient();
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const { data, error } = await supabase
      .from('productos')
      .select(BASE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('❌ Error GET /productos/[id]:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

/**
 * PATCH: Actualizar un producto específico
 */
export async function PATCH(req, { params }) {
  const supabase = createClient();
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

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

    const { data, error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', id)
      .select(BASE_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json({ message: 'Producto actualizado', data }, { status: 200 });
  } catch (err) {
    console.error('❌ Error PATCH /productos/[id]:', err);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

/**
 * DELETE: Eliminar un producto específico
 */
export async function DELETE(req, { params }) {
  const supabase = createClient();
  const { id } = params;

  if (!id) return NextResponse.json({ error: 'Falta ID' }, { status: 400 });

  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status });

    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Producto eliminado' }, { status: 200 });
  } catch (err) {
    console.error('❌ Error DELETE /productos/[id]:', err);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
