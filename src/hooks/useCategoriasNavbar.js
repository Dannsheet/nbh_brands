// src/hooks/useCategoriasNavbar.js
'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher'; // ✅ reutilizamos tu fetcher centralizado

// Orden fijo para las subcategorías de “Pantalones”
const ORDER_PANTS = ['BERMUDAS', 'Jeans Cargo', 'Parachute', 'Jeans clasicos'];

export default function useCategoriasNavbar() {
  const { data, error, isLoading } = useSWR('/api/categorias', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false, // 👈 evita loops si el endpoint falla
  });

  const categorias = useMemo(() => {
    if (!data) return [];

    // Nos aseguramos de que siempre venga un array de subcategorias
    const processedData = data.map(cat => ({
      ...cat,
      subcategorias: Array.isArray(cat.subcategorias) ? cat.subcategorias : [],
    }));

    // Ordenar solo si existe "Pantalones"
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
