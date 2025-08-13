import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

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

    // Obtener el inventario para los productos recuperados
    const productoIds = data.map(p => p.id);
    const { data: inventario, error: inventarioError } = await supabase
      .from('inventario_productos')
      .select('producto_id, talla, color')
      .in('producto_id', productoIds)
      .gt('cantidad', 0);

    if (inventarioError) {
      console.error('Error fetching inventario:', inventarioError);
      // Devolver solo los productos si el inventario falla, en lugar de bloquear todo
      return NextResponse.json(data);
    }

    // Mapear el inventario a cada producto
    const productosConInventario = data.map(producto => {
      const inventarioProducto = inventario.filter(item => item.producto_id === producto.id);
      const tallas = [...new Set(inventarioProducto.map(item => item.talla))];
      const colores = [...new Set(inventarioProducto.map(item => item.color))];
      return {
        ...producto,
        tallas, // Sobrescribir con tallas reales del inventario
        colores, // Sobrescribir con colores reales del inventario
      };
    });

    return NextResponse.json(productosConInventario);

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener los productos' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}