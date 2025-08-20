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

    // The new API already returns clean, hierarchical data.
    // We just need to ensure subcategorias is always an array and sort them.
    const processedData = data.map(cat => ({
      ...cat,
      subcategorias: cat.subcategorias || [],
    }));

    // Sort subcategories for 'Pantalones'
    const pantalones = processedData.find(cat => cat.slug === 'pantalones');
    if (pantalones && pantalones.subcategorias.length > 0) {
      pantalones.subcategorias.sort(
        (a, b) => ORDER_PANTS.indexOf(a.nombre) - ORDER_PANTS.indexOf(b.nombre)
      );
    }

    return processedData;
  }, [data]);

  return {
    categorias,
    isLoading,
    isError: !!error,
  };
}
