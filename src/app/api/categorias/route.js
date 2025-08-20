// src/app/api/categorias/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select(`
        id,
        nombre,
        slug,
        subcategorias:categorias!parent_id (
          id,
          nombre,
          slug
        )
      `)
      .is('parent_id', null)
      .order('nombre', { ascending: true });

    if (error) throw error;

    const result = (data || []).map(cat => ({
      ...cat,
      subcategorias: cat.subcategorias || []
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/categorias:", err);
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
