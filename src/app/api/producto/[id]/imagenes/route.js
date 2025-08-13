// src/app/api/producto/[id]/imagenes/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const color = searchParams.get('color');

    console.log('🔍 API Request:', { id, color });

    if (!id) {
      console.warn('❌ Missing product ID');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!color) {
      console.warn('❌ Missing color parameter');
      return NextResponse.json(
        { error: 'Color parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    
    const { data, error } = await supabase
    .from('imagenes_productos_colores')
    .select('url')
    .eq('producto_id', id)
    .eq('color', color)
    .order('orden', { ascending: true });  

    if (error) {
      console.error('❌ Error fetching images:', error);
      return NextResponse.json(
        { 
          error: 'Error al obtener las imágenes',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} images for product ${id}, color ${color}`);
    return NextResponse.json(data || []);

  } catch (err) {
    console.error('❌ Unexpected error in /api/producto/[id]/imagenes:', err);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    );
  }
}
