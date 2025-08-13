import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Query to get inventory data with product names
    const { data, error } = await supabase
      .from('inventario_productos')
      .select(`
        producto_id,
        color,
        talla,
        stock as unidades,
        productos:producto_id(nombre)
      `)
      .order('productos.nombre', { ascending: true })
      .order('color', { ascending: true })
      .order('talla', { ascending: true });

    if (error) {
      console.error('❌ Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Error al obtener el inventario' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedData = data.map(item => ({
      producto_id: item.producto_id,
      nombre: item.productos?.nombre || 'Producto desconocido',
      color: item.color,
      talla: item.talla,
      unidades: item.unidades
    }));

    return NextResponse.json({
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Unexpected error in /api/admin/inventario:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// This ensures the endpoint is not cached and always returns fresh data
export const dynamic = 'force-dynamic';
