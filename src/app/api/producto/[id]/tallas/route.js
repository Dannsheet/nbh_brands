// src/app/api/producto/[id]/tallas/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export async function GET(request, { params }) {
  try {
    const supabase = createClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color');

    if (!id || !color) {
      return NextResponse.json(
        { error: 'Missing product ID or color' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inventario_productos')
      .select('talla')
      .eq('producto_id', id)
      .eq('color', color)
      .gt('stock', 0);

    if (error) {
      console.error('❌ Error al obtener tallas:', error);
      return NextResponse.json(
        { error: 'Error al obtener tallas disponibles', details: error.message },
        { status: 500 }
      );
    }

    const tallasUnicas = [...new Set(data.map(item => item.talla))];
    return NextResponse.json(tallasUnicas);

  } catch (err) {
    console.error('❌ Error inesperado en /api/producto/[id]/tallas:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
