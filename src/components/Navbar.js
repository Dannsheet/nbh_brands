'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Search, Menu as MenuIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext'; // Importamos el contexto del carrito

const NavItem = dynamic(() => import('@/components/nav/NavItem'), { ssr: false });
const MobileNavPanel = dynamic(() => import('@/components/nav/MobileNavPanel'), { ssr: false });
const UserMenu = dynamic(() => import('./UserMenu'), { ssr: false });

export default function Navbar({ categorias = [] }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Obtenemos la cantidad total de items en el carrito desde el contexto
  const { totalCantidad } = useCart();

  const categoriaOrder = ['Colaboraciones', 'Camisetas', 'Pantalones', 'Accesorios'];
  const sortedCategorias = [...categorias].sort((a, b) => {
    const indexA = categoriaOrder.indexOf(a.nombre);
    const indexB = categoriaOrder.indexOf(b.nombre);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <header 
      className="global-navbar sticky top-0 z-50 w-full bg-black text-white border-b border-yellow-500"
      style={{ "--navbar-height": "60px" }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-[60px]">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Inicio" className="block h-12">
            <div className="relative w-[120px] h-full">
              <Image
                src="/logo-nbh.png"
                alt="NBH Logo"
                fill
                priority
                quality={90}
                sizes="(max-width: 768px) 80px, 120px"
                className="object-contain object-left"
              />
            </div>
          </Link>
        </div>

        {/* Categorías */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-4">
          {sortedCategorias.map((cat) => (
            <NavItem key={cat.id} cat={cat} />
          ))}
        </nav>

        {/* Iconos lado derecho */}
        <div className="flex items-center gap-3">
          <Link href="/rastreo" className="hidden sm:inline text-sm font-medium hover:text-yellow-400">Rastrear mi pedido</Link>
          <Link href="/ubicacion" className="text-sm font-medium hover:text-yellow-400">Encuéntranos</Link>
          <button className="hidden sm:inline-block p-1 hover:text-yellow-500" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <UserMenu />

          {/* Carrito con badge dinámico */}
          <Link href="/carrito" className="relative" aria-label="Carrito">
            <ShoppingCart className="w-5 h-5 hover:text-yellow-500" />
            {totalCantidad > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalCantidad > 9 ? "9+" : totalCantidad}
              </span>
            )}
          </Link>

          {/* Menú móvil */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Menú móvil">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <MobileNavPanel isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categorias={sortedCategorias} />
    </header>
  );
}
