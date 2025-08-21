'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import useCategoriasNavbar from '@/hooks/useCategoriasNavbar';
import { deepSanitize } from '@/lib/deepSanitize';

const adminPaths = ['/admin', '/login', '/registro'];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  const { categorias, isLoading, isError } = useCategoriasNavbar();

  if (adminPaths.includes(pathname) || pathname.startsWith('/admin/')) {
    return null;
  }

  if (isLoading) {
    // Puedes mostrar un skeleton/loader aquí si lo deseas
    return <div className="h-[60px] bg-black"></div>;
  }

  if (isError) {
    // Manejo de error
    return <div className="h-[60px] bg-black text-white flex items-center justify-center">Error al cargar menú</div>;
  }

  // Sanitizar antes de pasar a Navbar
  const safeCategorias = deepSanitize(categorias || []);
  if (process.env.DEBUG_POJO === 'true') {
    safeCategorias.forEach((c, i) => {
      if (Object.getPrototypeOf(c) !== Object.prototype) {
        console.warn(`[DEBUG][POJO] categoria #${i} no es POJO:`, c);
      }
    });
  }

  return <Navbar categorias={safeCategorias} />;
}
