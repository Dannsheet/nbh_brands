import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function CategoriaPage({ params }) {
  const { categoria } = params;

  // Buscar productos de la categoría
  const { data: productos, error } = await supabaseAdmin
    .from("productos")
    .select("*")
    .eq("categoria_id", categoria) // ⚠️ si tu slug está en categorias, hay que resolver el id
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando categoría:", error.message);
    return <div>Error al cargar productos de {categoria}</div>;
  }

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
