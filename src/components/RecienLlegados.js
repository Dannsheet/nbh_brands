'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';

// Título reutilizable para el catálogo (se puede mover a src/components/CatalogTitle.tsx)
function CatalogTitle({ children = 'CATÁLOGO' }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="not-italic font-extrabold text-yellow-400 text-2xl md:text-5xl">
        {children}
      </h2>
      <div className="w-24 mx-auto mt-2 border-b-4 border-yellow-400" />
    </div>
  );
}

// El componente de la tarjeta de producto que maneja su propio estado
function ProductoCard({ producto }) {
  const router = useRouter();
  
  // Colores únicos desde variantes del backend (evitar duplicados y valores inválidos)
  const uniqueColors = Array.from(
    new Set(
      (producto?.variantes || [])
        .map((v) => (v && typeof v.color === 'string' ? v.color.trim() : ''))
        .filter((c) => c)
    )
  );

  // Imagen principal y secundaria para hover
  const imagenPrincipal = producto.imagen_principal || producto.imagenes?.[0] || '/placeholder.png';
  const imagenSecundaria = (() => {
    // Priorizar imagen distinta a la principal desde variantes
    const fromVariantes = (producto?.variantes || [])
      .map((v) => v?.imagen_url)
      .filter((u) => typeof u === 'string' && u.length > 0 && u !== imagenPrincipal);
    if (fromVariantes.length > 0) return fromVariantes[0];
    // Fallback a una segunda imagen del arreglo si existe y es distinta
    const fallback = producto?.imagenes?.[1];
    return typeof fallback === 'string' && fallback !== imagenPrincipal ? fallback : '';
  })();

  // Preload de imagen secundaria para evitar parpadeos
  useEffect(() => {
    if (imagenSecundaria && typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = imagenSecundaria;
    }
  }, [imagenSecundaria]);

  return (
    <div
      className="group cursor-pointer flex flex-col h-full"
      onClick={() => router.push(`/producto/${producto.slug || producto.id}`)}
    >
      {/* Contenedor de imagen con proporción 4:5 y hover swap */}
      <div className="relative w-full pb-[125%] bg-gray-900 rounded overflow-hidden shadow-lg transition-shadow duration-300 ease-in-out group-hover:shadow-xl">
        {/* Imagen principal */}
        <NextImage
          src={imagenPrincipal}
          alt={producto.nombre}
          fill
          sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
          priority={false}
          loading="lazy"
          className={`object-cover transition-opacity duration-500 ease-in-out ${imagenSecundaria ? 'group-hover:opacity-0' : ''}`}
        />
        {/* Imagen secundaria superpuesta para hover */}
        {imagenSecundaria ? (
          <NextImage
            src={imagenSecundaria}
            alt={`${producto.nombre} secundario`}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            priority={false}
            loading="lazy"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
          />
        ) : null}
      </div>

      {/* Información del producto */}
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="text-white uppercase font-bold text-lg leading-tight line-clamp-2 text-center">{producto.nombre}</h3>

        {/* Precio centrado debajo de la imagen */}
        <p className="text-yellow-400 font-bold text-center mt-2">${producto.precio}</p>

        {/* Círculos de colores debajo del precio, centrados */}
        {uniqueColors.length > 0 ? (
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            {uniqueColors.map((color) => {
              // Validar si el color es soportado por CSS; si no, usar un fallback
              const isSupported = typeof window !== 'undefined' && CSS?.supports?.('color', color);
              const bg = isSupported ? color : '#9ca3af'; // gray-400 fallback
              return (
                <div
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: bg }}
                  title={color}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            })}
          </div>
        ) : null}

        {/* Se eliminan tallas y selector de color en vista previa, así como el botón de agregar */}
      </div>
    </div>
  );
}

export default function RecienLlegados() {
  const [productos, setProductos] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchPage = useCallback(async (pageToLoad) => {
    if (loading || !hasMore) return;
    try {
      setLoading(true);
      const limit = 12;
      const res = await fetch(`/api/productos?page=${pageToLoad}&limit=${limit}`);
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      const nuevos = Array.isArray(data?.productos) ? data.productos : Array.isArray(data) ? data : [];
      setProductos((prev) => {
        // Evitar duplicados por id
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...nuevos.filter((p) => !seen.has(p.id))];
        return merged;
      });
      setHasMore(nuevos.length === limit);
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    // Carga inicial
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        fetchPage(page);
      }
    }, { root: null, rootMargin: '0px', threshold: 1.0 });

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [fetchPage, loading, hasMore, page]);

  return (
    <section className="p-6">
      <CatalogTitle />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map(producto => (
          <ProductoCard key={producto.id} producto={producto} />
        ))}
      </div>

      {/* Loader y sentinel para scroll infinito */}
      <div ref={loaderRef} className="flex items-center justify-center py-6">
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            <span>Cargando más productos...</span>
          </div>
        )}
        {!hasMore && (
          <span className="text-sm text-gray-500">No hay más productos</span>
        )}
      </div>
    </section>
  );
}
