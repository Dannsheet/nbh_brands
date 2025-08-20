'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function MobileNavItem({ cat, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubcategorias = cat.subcategorias && cat.subcategorias.length > 0;

  const handleToggle = (e) => {
    if (hasSubcategorias) {
      e.preventDefault(); // Prevent link navigation
      setIsOpen(!isOpen);
    }
    // If no subcategories, the link will navigate and onClose will be triggered by handleLinkClick
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="border-b border-gray-800">
      <Link
        href={`/productos/categoria/${cat.slug}`}
        onClick={hasSubcategorias ? handleToggle : handleLinkClick}
        className="flex w-full items-center justify-between py-3 text-left text-base font-semibold hover:text-yellow-400"
      >
        <span>{cat.nombre}</span>
        {hasSubcategorias && (
          <ChevronDown
            size={20}
            className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </Link>

      {hasSubcategorias && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <ul className="pl-4 pt-2 pb-2 flex flex-col gap-2">
            {cat.subcategorias.map((subcat) => (
              <li key={subcat.id}>
                <Link
                  href={`/productos/categoria/${cat.slug}/${subcat.slug}`}
                  onClick={handleLinkClick}
                  className="block py-1 text-sm text-gray-300 hover:text-yellow-400"
                >
                  {subcat.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
