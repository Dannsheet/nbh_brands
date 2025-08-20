// src/app/api/categorias/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.rpc("exec", {
      query: `
        SELECT
          c.id,
          c.nombre,
          c.slug,
          COALESCE(
            json_agg(
              json_build_object(
                'id', sc.id,
                'nombre', sc.nombre,
                'slug', sc.slug
              )
            ) FILTER (WHERE sc.id IS NOT NULL),
            '[]'
          ) AS subcategorias
        FROM categorias c
        LEFT JOIN categorias sc ON sc.parent_id = c.id
        WHERE c.parent_id IS NULL -- solo categorías principales
        GROUP BY c.id, c.nombre, c.slug
        ORDER BY c.nombre;
      `,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error en /api/categorias:", err.message);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}
