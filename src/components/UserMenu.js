"use client";
import { Menu } from "@headlessui/react";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function UserMenu({ user }) {
  const router = useRouter();

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
          ) : (
            <>
              <Menu.Item href="/login" as="a">
                {({ active }) => (
                  <Link
                    href="/login"
                    className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      active 
                        ? "bg-secondary text-primary" 
                        : "text-accent hover:bg-gray-800"
                    }`}
                    aria-label="Ir a página de inicio de sesión"
                  >
                    Iniciar sesión
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item href="/registro" as="a">
                {({ active }) => (
                  <Link
                    href="/registro"
                    className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      active 
                        ? "bg-secondary text-primary" 
                        : "text-accent hover:bg-gray-800"
                    }`}
                    aria-label="Ir a página de registro"
                  >
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