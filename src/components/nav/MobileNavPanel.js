'use client';

import { X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Componente recursivo para categoría y sus hijas
function MobileCategoryItem({ cat, depth = 0, onClose }) {
  const [open, setOpen] = useState(false);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <div>
      <button
        className={`flex w-full items-center justify-between py-2 pl-${depth ? 6 : 0} pr-2 text-left ${depth ? 'text-sm' : 'text-base font-semibold'} hover:text-yellow-400`}
        onClick={() => {
          if (hasChildren) {
            setOpen(!open);
          } else {
            onClose();
          }
        }}
      >
        <Link href={`/productos/categoria/${cat.slug}`} onClick={onClose} className="flex-1">
          {cat.nombre}
        </Link>
        {hasChildren && <ChevronDown size={16} className={`${open ? 'rotate-180' : ''} transition-transform`} />}
      </button>

      {hasChildren && open && (
        <div className="pl-4">
          {cat.children.map((sub) => (
            <MobileCategoryItem key={sub.id} cat={sub} depth={depth + 1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileNavPanel({ isOpen, onClose, categorias }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm md:hidden" onClick={onClose}>
      <div
        className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-black text-white p-5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 p-2" aria-label="Cerrar menú">
          <X className="h-6 w-6" />
        </button>

        <nav className="mt-12 flex flex-col gap-2">
          {/* Enlace Tienda */}
          <Link href="/productos" onClick={onClose} className="mb-3 border-b border-gray-700 pb-3 text-lg font-semibold">Tienda</Link>

          {/* Categorías padre */}
          {categorias.map((cat) => (
            <MobileCategoryItem key={cat.id} cat={cat} onClose={onClose} />
          ))}
        </nav>
      </div>
    </div>
  );
}
