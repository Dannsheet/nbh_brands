import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

// Función recursiva para obtener subcategorías
async function getSubcategorias(categoriaId) {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, slug')
    .eq('parent_id', categoriaId);

  if (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }

  // Para cada subcategoría, busca sus propias subcategorías
  for (const sub of data) {
    sub.children = await getSubcategorias(sub.id);
  }

  return data;
}

export async function GET() {
  try {
    // 1. Obtener solo las categorías principales (las que no tienen padre)
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('id, nombre, slug')
      .is('parent_id', null);

    if (error) {
      console.error('Error fetching parent categories:', error);
      throw new Error(error.message);
    }

    // 2. Para cada categoría principal, obtener sus hijos de forma recursiva
    for (const cat of categorias) {
      cat.children = await getSubcategorias(cat.id);
    }

    return NextResponse.json(categorias);

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener las categorías' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
