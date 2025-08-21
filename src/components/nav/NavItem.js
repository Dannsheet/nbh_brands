'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function NavItem({ cat }) {
  const hasSubcategorias = Array.isArray(cat.subcategorias) && cat.subcategorias.length > 0;

  if (hasSubcategorias) {
    // Solo abre el menú, no redirige
    return (
      <div className="relative group">
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1 text-sm font-medium hover:text-yellow-400 transition-colors duration-200 focus:outline-none"
          aria-expanded="true"
          aria-haspopup="true"
        >
          {cat.nombre}
          <ChevronDown size={16} className="transition-transform duration-200 group-hover:rotate-180" />
        </button>
        {/* Subcategorías */}
        <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
          <ul className="w-48 rounded-md bg-black py-2 text-white shadow-lg border border-gray-800">
            {cat.subcategorias.map((subcat) => (
              <li key={subcat.id}>
                <Link
                  href={`/productos/categoria/${cat.slug}/${subcat.slug}`}
                  className="block px-4 py-2 text-sm hover:bg-yellow-500 hover:text-black transition-colors duration-200"
                >
                  {subcat.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Si no tiene subcategorías, sí redirige
  return (
    <div className="relative group">
      <Link
        href={`/productos/categoria/${cat.slug}`}
        className="flex items-center gap-1 px-3 py-1 text-sm font-medium hover:text-yellow-400 transition-colors duration-200"
        aria-expanded="false"
        aria-haspopup="false"
      >
        {cat.nombre}
      </Link>
    </div>
  );
}
