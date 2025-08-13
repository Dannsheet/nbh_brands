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
        <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-md bg-black py-2 text-white shadow-lg border border-gray-700 max-h-[70vh] overflow-auto">
          <ul className="px-1">
            {(cat.nombre === 'Pantalones'
              ? [...cat.children].sort((a, b) => {
                  const order = ['Jeans Cargo', 'Jeans Clásicos', 'Parachutes'];
                  return order.indexOf(a.nombre) - order.indexOf(b.nombre);
                })
              : cat.children
            ).map((subcat) => (
              <li key={subcat.id} className="">
                <Link
                  href={`/productos/categoria/${subcat.slug}`}
                  className="block px-4 py-2 text-sm hover:bg-yellow-500 hover:text-black"
                >
                  {subcat.nombre}
                </Link>
                {/* Render recursivo de nietas y más profundidades */}
                {subcat.children?.length > 0 && (
                  <ul className="ml-4 border-l border-gray-700">
                    {subcat.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/productos/categoria/${child.slug}`}
                          className="block px-4 py-2 text-sm hover:bg-yellow-500 hover:text-black"
                        >
                          {child.nombre}
                        </Link>
                        {child.children?.length > 0 && (
                          <ul className="ml-4 border-l border-gray-700">
                            {child.children.map((gchild) => (
                              <li key={gchild.id}>
                                <Link
                                  href={`/productos/categoria/${gchild.slug}`}
                                  className="block px-4 py-2 text-sm hover:bg-yellow-500 hover:text-black"
                                >
                                  {gchild.nombre}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
