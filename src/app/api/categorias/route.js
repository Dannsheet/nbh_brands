import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const revalidate = 60;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select(`
        id,
        nombre,
        slug,
        subcategorias:subcategorias (
          id,
          nombre,
          slug
        )
      `)
      .order('nombre', { ascending: true });

    if (error) throw error;

    // Ensure subcategorias is always an array
    const result = data.map(cat => ({
      ...cat,
      subcategorias: cat.subcategorias || []
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error en /api/categorias:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
