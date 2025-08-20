import { supabaseAdmin } from "@/lib/supabase/admin";

export async function fetchCategoriasConSubcategorias() {
  const { data: categorias, error } = await supabaseAdmin
    .from("categorias")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) throw error;

  // Para cada categoría, cargar subcategorías
  const categoriasConSub = await Promise.all(
    categorias.map(async (cat) => {
      const { data: subcats } = await supabaseAdmin
        .from("subcategorias")
        .select("id, nombre, categoria_id")
        .eq("categoria_id", cat.id)
        .order("nombre", { ascending: true });
      return { ...cat, subcategorias: subcats || [] };
    })
  );

  return categoriasConSub;
}
