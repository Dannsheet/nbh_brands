import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizeProductos } from '@/lib/sanitize';
import { deepSanitize } from '@/lib/deepSanitize';
import AnimatedSubcatTitle from '@/components/AnimatedSubcatTitle';
import ProductoCard from '@/components/producto/ProductoCard';

// Ajusta el import del componente de productos según tu estructura
// Si tienes un componente cliente para la lista de productos, importa aquí
// import ProductosList from '@/components/producto/ProductosList';

export default async function SubcategoriaPage({ params }) {
  const { categoria, subcategoria } = await params;

  // Guard clause para assets / favicon
  if (!categoria || !subcategoria || categoria.includes('.') || subcategoria.includes('.')) {
    return new Response(null, { status: 204 });
  }

  // Buscar subcategoria y validar parent slug
  const { data: sc, error: scErr } = await supabaseAdmin
    .from('categorias')
    .select('id, nombre, slug, parent_id')
    .eq('slug', subcategoria)
    .maybeSingle();

  if (scErr || !sc) {
    return new Response(null, { status: 404 });
  }

  // Buscar parent para validar match
  const { data: parent } = await supabaseAdmin
    .from('categorias')
    .select('id, slug')
    .eq('id', sc.parent_id)
    .maybeSingle();

  if (!parent || parent.slug !== categoria) {
    return new Response(null, { status: 404 });
  }

  // Traer productos por subcategoria
  const { data: productosRaw, error: prodErr } = await supabaseAdmin
    .from('productos')
    .select('id, nombre, slug, precio, imagen_url, imagenes, created_at, subcategoria_id')
    .eq('subcategoria_id', sc.id)
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.error('Error cargando subcategoria:', prodErr);
    return new Response(null, { status: 500 });
  }

  const productos = sanitizeProductos(productosRaw || []);
  const safeProductos = deepSanitize(productos);

  // Debug opcional
  if (process.env.DEBUG_POJO === 'true') {
    safeProductos.forEach((p, i) => {
      if (Object.getPrototypeOf(p) !== Object.prototype) {
        console.warn(`[DEBUG][POJO] producto #${i} no es POJO:`, p);
      }
    });
  }

  // Renderizado simple, puedes reemplazar por tu componente cliente
  return (
    <section className="p-6">
      <AnimatedSubcatTitle title={sc.nombre} />
      {safeProductos.length === 0 ? (
        <div className="flex h-60 items-center justify-center rounded-md border border-dashed border-gray-700">
          <p className="text-gray-400">No hay productos en esta subcategoría por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {safeProductos.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </section>
  );
}
