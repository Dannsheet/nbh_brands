'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import MobileNavItem from './MobileNavItem'; // Importar el nuevo componente

export default function MobileNavPanel({ isOpen, onClose, categorias }) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* Fondo con backdrop-blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Panel de navegación */}
      <div
        className={`absolute left-0 top-0 h-full w-4/5 max-w-xs bg-black text-white p-5 overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="h-6 w-6" />
        </button>

        <nav className="mt-12 flex flex-col">
          <Link
            href="/productos"
            onClick={onClose}
            className="mb-4 border-b border-gray-700 pb-3 text-lg font-semibold hover:text-yellow-400"
          >
            Tienda
          </Link>

          {categorias.map((cat) => (
            <MobileNavItem key={cat.id} cat={cat} onClose={onClose} />
          ))}
        </nav>
      </div>
    </div>
  );
}
