import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

export const revalidate = 60; // Revalidar cada 60 segundos

export async function GET() {
  try {
    const query = `
      WITH RECURSIVE categorias_padre AS (
        SELECT id, nombre, slug, parent_id, 0 AS nivel
        FROM categorias
        WHERE parent_id IS NULL
      ),
      categorias_hijo AS (
        SELECT id, nombre, slug, parent_id, nivel + 1
        FROM categorias
        JOIN categorias_padre ON categorias.parent_id = categorias_padre.id
        UNION ALL
        SELECT c.id, c.nombre, c.slug, c.parent_id, ch.nivel + 1
        FROM categorias c
        JOIN categorias_hijo ch ON c.parent_id = ch.id
      )
      SELECT 
        cp.id,
        cp.nombre,
        cp.slug,
        COALESCE(
          json_agg(
            distinct jsonb_build_object('id', ch.id, 'nombre', ch.nombre, 'slug', ch.slug)
          ) filter (where ch.id is not null),
          '[]'
        ) as subcategorias
      FROM categorias_padre cp
      LEFT JOIN categorias_hijo ch ON cp.id = ch.parent_id
      GROUP BY cp.id, cp.nombre, cp.slug
      ORDER BY cp.nombre;
    `;

    const { data, error } = await supabase.rpc('sql', { query });

    if (error) {
      console.error('Error fetching categories with subcategories:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(data);

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Error al obtener las categorías' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
