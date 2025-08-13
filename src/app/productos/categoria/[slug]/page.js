// src/app/productos/categoria/[slug]/page.js

import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function obtenerDatosPorSlug(slug) {
  // Buscar la categoría por slug (puede ser padre o hija)
  const { data: cat, error } = await supabase
    .from('categorias')
    .select('id, nombre, parent_id')
    .eq('slug', slug)
    .single();

  if (error || !cat) return { cat: null };

  // Si es subcategoría (tiene parent_id)
  if (cat.parent_id) {
    const { data: productos, error: prodErr } = await supabase
      .from('productos')
      .select('*')
      .eq('subcategoria_id', cat.id);

    if (prodErr) console.error(prodErr);

    return { cat, productos: productos || [] };
  }

  // Si es categoría padre, obtener sus subcategorías
  const { data: subcats, error: subErr } = await supabase
    .from('categorias')
    .select('id, nombre, slug')
    .eq('parent_id', cat.id);

  if (subErr) console.error(subErr);

  return { cat, subcategorias: subcats || [] };
}

export default async function CategoryPage({ params }) {
  const { slug } = params;

  // Caso especial: colaboraciones
  if (slug === 'colaboraciones') {
    const { data: productosColab, error: colabErr } = await supabase
      .from('productos')
      .select('*')
      .eq('es_colaboracion', true);

    if (colabErr) console.error(colabErr);

    return (
      <section className="p-6">
        <h1 className="mb-6 text-3xl font-bold text-yellow-400">COLABORACIONES</h1>
        {productosColab?.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosColab.map((producto) => (
              <Link
                key={producto.id}
                href={`/producto/${producto.slug}`}
                className="group overflow-hidden rounded-lg bg-gray-900 shadow transition hover:shadow-lg"
              >
                <div className="overflow-hidden">
                  <Image
                    src={producto.imagenes?.[0] || '/placeholder.jpg'}
                    alt={producto.nombre}
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white">{producto.nombre}</h3>
                  <p className="font-bold text-yellow-400">${producto.precio}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-60 items-center justify-center rounded-md border border-dashed border-gray-700">
            <p className="text-gray-400">Actualmente no hay colaboraciones disponibles.</p>
          </div>
        )}
      </section>
    );
  }

  const { cat, productos = [], subcategorias = [] } = await obtenerDatosPorSlug(slug);

  if (!cat) {
    notFound();
  }

  const isParent = subcategorias.length > 0;

  return (
    <section className="p-6">
      <h1 className="mb-6 text-3xl font-bold text-white">{cat.nombre}</h1>

      {isParent ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {subcategorias.map((sub) => (
            <Link
              key={sub.id}
              href={`/productos/categoria/${sub.slug}`}
              className="group flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-700 p-6 hover:bg-gray-800"
            >
              <span className="text-lg font-semibold text-yellow-400 group-hover:underline">
                {sub.nombre}
              </span>
              <span className="text-sm text-gray-400">Ver productos</span>
            </Link>
          ))}
        </div>
      ) : productos && productos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <Link
              key={producto.id}
              href={`/producto/${producto.slug}`}
              className="group overflow-hidden rounded-lg bg-gray-900 shadow transition hover:shadow-lg"
            >
              <div className="overflow-hidden">
                <Image
                  src={producto.imagenes?.[0] || '/placeholder.jpg'}
                  alt={producto.nombre}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white">{producto.nombre}</h3>
                <p className="font-bold text-yellow-400">${producto.precio}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-60 items-center justify-center rounded-md border border-dashed border-gray-700">
          <p className="text-gray-400">No hay productos en esta subcategoría por el momento.</p>
        </div>
      )}
    </section>
  );
}
