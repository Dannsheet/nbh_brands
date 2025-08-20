import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function CategoriaPage({ params }) {
  const { categoria } = await params;
  if (!categoria || categoria.endsWith('.ico') || categoria === 'favicon.ico') {
    return new Response(null, { status: 204 });
  }

  // Buscar productos de la categoría
  const { data, error } = await supabaseAdmin
    .from("productos")
    .select("id, nombre, slug, precio, imagen_url, created_at")
    .eq("categoria_id", categoria)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando categoría:", error.message);
    return <div>Error al cargar productos de {categoria}</div>;
  }

  const productos = (data || []).map(p => ({
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    precio: p.precio ? Number(p.precio) : null,
    imagen_url: p.imagen_url,
    created_at: p.created_at ? new Date(p.created_at).toISOString() : null,
  }));

  if (!productos || productos.length === 0) {
    return <div>No hay productos en {categoria}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{categoria}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {productos.map((producto) => (
          <div key={producto.id} className="border p-4">
            <img src={producto.imagen_url} alt={producto.nombre} />
            <h2 className="font-semibold">{producto.nombre}</h2>
            <p>${producto.precio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
