"use client";
import { Menu } from "@headlessui/react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from 'react';

export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null); // null: unknown, true/false: known

  useEffect(() => {
    let mounted = true;

    const checkUserRole = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          const { data: profile, error } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', currentUser.id)
            .single();

          if (error) throw error;

          if (profile?.rol === 'admin') {
            setIsAdmin(true);
            router.prefetch('/admin'); // Prefetch for better UX
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking user role:', error.message);
        if (mounted) setIsAdmin(false);
      }
    };

    checkUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUserRole();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="p-2 rounded-full hover:text-secondary hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label={user ? "Menú de usuario" : "Menú de autenticación"}
      >
        <User className="w-5 h-5" aria-hidden="true" />
      </Menu.Button>
      
      <Menu.Items
        className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-[#111] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-700"
      >
        <div className="py-1">
          {user ? (
            <>
              {isAdmin && (
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/admin"
                      className={`block w-full text-left px-4 py-2 text-sm font-bold transition-colors duration-200 ${
                        active
                          ? 'bg-yellow-400 text-black'
                          : 'text-yellow-400'
                      }`}
                    >
                      Panel Admin
                    </Link>
                  )}
                </Menu.Item>
              )}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      active 
                        ? "bg-secondary text-primary" 
                        : "text-accent hover:bg-gray-800"
                    }`}
                    aria-label="Cerrar sesión y salir de la cuenta"
                  >
                    Cerrar sesión
                  </button>
                )}
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/login"
                    className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${active ? 'bg-secondary text-primary' : 'text-accent hover:bg-gray-800'}`}>
                    Iniciar sesión
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/register"
                    className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${active ? 'bg-secondary text-primary' : 'text-accent hover:bg-gray-800'}`}>
                    Registrarse
                  </Link>
                )}
              </Menu.Item>
            </>
          )}
        </div>
      </Menu.Items>
    </Menu>
  );
}