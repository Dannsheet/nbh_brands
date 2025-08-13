// src/hooks/useCategoriasNavbar.js
'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

// Orden fijo para las subcategorías de “Pantalones”
const ORDER_PANTS = ['Jeans Cargo', 'Jeans Clásicos', 'Parachutes'];

export default function useCategoriasNavbar() {
  const { data, error, isLoading } = useSWR('/api/categorias', fetcher, {
    revalidateOnFocus: false,
  });

  const categorias = useMemo(() => {
    if (!data) return [];

    // Deduplicación recursiva por id
    const dedup = (items) => {
      const seen = new Set();
      return (items || []).filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        if (item.children?.length) {
          item.children = dedup(item.children);
        }
        return true;
      });
    };

    const resultado = dedup(structuredClone(data));

    // Ordenar subcategorías de pantalones
    resultado.forEach((cat) => {
      if (cat.slug === 'pantalones' && Array.isArray(cat.children)) {
        cat.children.sort(
          (a, b) => ORDER_PANTS.indexOf(a.nombre) - ORDER_PANTS.indexOf(b.nombre)
        );
      }
    });

    return resultado;
  }, [data]);

  return {
    categorias,
    isLoading,
    isError: !!error,
  };
}
