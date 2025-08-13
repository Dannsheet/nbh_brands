import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error(`Error fetching producto con slug ${slug}:`, error);
      // Si el error es porque no se encontró la fila, devolvemos un 404
      if (error.code === 'PGRST116') { 
        return new NextResponse(JSON.stringify({ error: 'Producto no encontrado' }), { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener el producto' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
