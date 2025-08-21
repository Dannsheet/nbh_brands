import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import { deepSanitize } from '@/lib/deepSanitize';
import { sanitizeProductos } from '@/lib/sanitize';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const etiqueta = searchParams.get('etiqueta');
  const subcategoria_id = searchParams.get('subcategoria_id');

  try {
    let query = supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (etiqueta) {
      query = query.eq('etiqueta', etiqueta);
    }

    if (subcategoria_id) {
      query = query.eq('subcategoria_id', subcategoria_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching productos:', error);
      throw error;
    }

    // deepSanitize productos
    const safeProductos = deepSanitize(data);

    // Normalizar el campo imagenes en todos los productos
    const productosConImagenes = safeProductos.map(producto => {
      let imagenes = [];
      if (Array.isArray(producto.imagenes)) {
        imagenes = producto.imagenes;
      } else if (producto.imagen_url) {
        imagenes = [producto.imagen_url];
      }
      return {
        ...producto,
        imagenes,
      };
    });

    // Obtener el inventario para los productos recuperados
    const productoIds = productosConImagenes.map(p => p.id);
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario_productos')
      .select('producto_id, talla, color, stock')
      .in('producto_id', productoIds)
      .gt('stock', 0);

    if (inventarioError) {
      console.error('Error fetching inventario:', inventarioError);
      // Devolver solo los productos si el inventario falla, en lugar de bloquear todo
      return NextResponse.json(sanitizeProductos(productosConImagenes));
    }

    // deepSanitize inventario
    const safeInventario = deepSanitize(inventario);

    // Mapear el inventario a cada producto
    const productosConInventario = productosConImagenes.map(producto => {
      const inventarioProducto = safeInventario.filter(item => item.producto_id === producto.id);
      const tallas = [...new Set(inventarioProducto.map(item => item.talla))];
      const colores = [...new Set(inventarioProducto.map(item => item.color))];
      // Alias cantidad: stock (compatibilidad frontend)
      const inventarioCompat = inventarioProducto.map(i => ({ ...i, cantidad: i.stock }));
      return {
        ...producto,
        tallas,
        colores,
        inventario: inventarioCompat,
      };
    });

    return NextResponse.json(sanitizeProductos(productosConInventario));

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener los productos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}