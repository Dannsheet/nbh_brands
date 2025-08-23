'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import ProductoCard from "@/components/producto/ProductoCard";

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
