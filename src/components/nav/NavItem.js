'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

export default function NavItem({ cat }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link
        href={`/productos/categoria/${cat.slug}`}
        className="flex items-center gap-1 px-3 py-1 text-sm font-medium hover:text-yellow-400"
        aria-expanded={isOpen}
        aria-haspopup={!!cat.children?.length}
      >
        {cat.nombre}
        {cat.children?.length > 0 && <ChevronDown size={16} />}
      </Link>
      {isOpen && cat.children?.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md bg-black py-1 text-white shadow-lg border border-gray-700">
          {(cat.nombre === 'Pantalones'
            ? [...cat.children].sort((a, b) => {
                const order = ['Jeans Cargo', 'Jeans Clásicos', 'Parachutes'];
                return order.indexOf(a.nombre) - order.indexOf(b.nombre);
              })
            : cat.children
          ).map((subcat) => (
            <li key={subcat.id}>
              <Link
                href={`/productos/categoria/${subcat.slug}`}
                className="block px-4 py-2 text-sm hover:bg-yellow-500 hover:text-black"
              >
                {subcat.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
