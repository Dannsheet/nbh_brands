// src/hooks/useCategoriasNavbar.js
'use client';
import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

const ORDER_PANTS = ['Jeans Cargo', 'Jeans Clásicos', 'Parachutes'];

export default function useCategoriasNavbar() {
  const { data, error, isLoading } = useSWR('/api/categorias', fetcher, { revalidateOnFocus: false });

  const categorias = useMemo(() => {
    if (!data) return [];
    const processed = data.map(cat => ({ ...cat, subcategorias: cat.subcategorias || [] }));
    const pantalones = processed.find(c => c.slug === 'pantalones');
    if (pantalones) {
      pantalones.subcategorias.sort((a,b) => ORDER_PANTS.indexOf(a.nombre) - ORDER_PANTS.indexOf(b.nombre));
    }
    return processed;
  }, [data]);

  return { categorias, isLoading, isError: !!error };
}
