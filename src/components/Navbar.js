'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import useCategoriasNavbar from '@/hooks/useCategoriasNavbar';
import { ShoppingCart, Search, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';

const NavItem = dynamic(() => import('@/components/nav/NavItem'), { ssr: false });
const MobileNavPanel = dynamic(() => import('@/components/nav/MobileNavPanel'), { ssr: false });
const UserMenu = dynamic(() => import('./UserMenu'), { ssr: false });

export default function Navbar() {
  const [user, setUser] = useState(null);
  // Hook centralizado para obtener categorías organizadas
  const { categorias, isLoading, isError } = useCategoriasNavbar();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authSubscription = useRef(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    authSubscription.current = subscription;

    // Cleanup subscription on unmount
    return () => {
      if (authSubscription.current) {
        authSubscription.current.unsubscribe();
      }
    };
  }, []);

  // Definir el orden deseado para las categorías (cuando hay datos)
  const categoriaOrder = ['Colaboraciones', 'Camisetas', 'Pantalones', 'Accesorios'];
  const sortedCategorias = [...categorias].sort((a, b) => {
    const indexA = categoriaOrder.indexOf(a.nombre);
    const indexB = categoriaOrder.indexOf(b.nombre);
    // Si alguna categoría no está en la lista, se va al final
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <header className="sticky top-0 z-50 w-full bg-black text-white border-b border-yellow-500">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-[60px]">
        
        {/* Logo - lado izquierdo */}
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

        {/* Categorías centradas */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-4">
          {sortedCategorias.map((cat) => (
            <NavItem key={cat.id} cat={cat} />
          ))}
          {(isLoading && !categorias) && <span className="text-gray-500 text-sm">Cargando...</span>}
          {isError && <span className="text-red-500 text-sm">Error al cargar categorías</span>}
        </nav>

        {/* Iconos lado derecho */}
        <div className="flex items-center gap-3">
          <Link href="/rastreo" className="hidden sm:inline text-sm font-medium hover:text-yellow-400">Rastrear mi pedido</Link>
          <Link href="/ubicacion" className="text-sm font-medium hover:text-yellow-400">Encuéntranos</Link>
          <button className="hidden sm:inline-block p-1 hover:text-yellow-500" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <UserMenu user={user} />
          <Link href="/carrito" aria-label="Carrito">
            <ShoppingCart className="w-5 h-5 hover:text-yellow-500" />
          </Link>

          {/* Menú hamburguesa */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Menú móvil">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <MobileNavPanel isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} categorias={sortedCategorias} />
    </header>
  );
}
