// src/app/[categoria]/[subcategoria]/page.js
import { supabase } from "@/lib/supabase/client";
import { sanitizeProductos } from "@/lib/sanitize";
import { deepSanitize } from "@/lib/deepSanitize";
import Image from "next/image";

export default async function SubcategoriaPage({ params }) {
  const { categoria, subcategoria } = await params;
  if (!categoria || categoria.endsWith('.ico') || categoria === 'favicon.ico') {
    return new Response(null, { status: 204 });
  }

  // 1. Buscar la categoría padre
  const { data: catData, error: catError } = await supabase
    .from("categorias")
    .select("id")
    .eq("slug", categoria)
    .single();

  if (catError || !catData) {
    return <h1>Categoría no encontrada</h1>;
  }

  // 2. Buscar la subcategoría
  const { data: subData, error: subError } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("slug", subcategoria)
    .eq("parent_id", catData.id) // aseguramos que sea hija
    .single();

  if (subError || !subData) {
    return <h1>Subcategoría no encontrada</h1>;
  }

  // 3. Traer productos por subcategoria_id
  const { data, error: prodError } = await supabase
    .from("productos")
    .select("id, nombre, slug, precio, imagen_url, created_at")
    .eq("subcategoria_id", subData.id);

  if (prodError) {
    return <h1>Error cargando productos</h1>;
  }

  const safe = deepSanitize(data);
  const productos = sanitizeProductos(safe);

  // Debug temporal para detectar non-POJO
  if (Array.isArray(productos)) {
    productos.forEach((p, i) => {
      if (Object.getPrototypeOf(p) !== Object.prototype) {
        console.warn(`[DEBUG][POJO] Producto #${i} no es POJO:`, p);
      }
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{subData.nombre}</h1>
      {productos.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {productos.map((p) => (
            <li key={p.id} className="border p-4 rounded">
              <Image src={p.imagen_url} alt={p.nombre} width={400} height={400} className="mb-2 object-cover" />
              <h2>{p.nombre}</h2>
              <p>${p.precio}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
