'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AdminHeader from './AdminHeader';
import SidebarLink from './SidebarLink';
import {
  BarChart2,
  Shirt,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Users,
  CreditCard,
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: <BarChart2 className="w-5 h-5" /> },
  { name: 'Órdenes', path: '/admin/ordenes', icon: <FileText className="w-5 h-5" />, key: 'ordenes' },
  { name: 'Productos', path: '/admin/productos', icon: <Shirt className="w-5 h-5" /> },
  { name: 'Inventario', path: '/admin/inventario', icon: <Package className="w-5 h-5" /> },
  { name: 'Usuarios', path: '/admin/usuarios', icon: <Users className="w-5 h-5" /> },
  { name: 'Pagos/Reportes', path: '/admin/reportes', icon: <CreditCard className="w-5 h-5" /> },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);

  // Efecto para verificar el rol de admin
  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.replace('/login');

        const { data: usr, error } = await supabase
          .from('usuarios')
          .select('id, nombre, email, rol')
          .eq('id', user.id)
          .single();

        if (error || usr?.rol !== 'admin') return router.replace('/');
        if (mounted) setProfile(usr);
      } catch (err) {
        console.error('Error checking admin:', err);
        router.replace('/');
      } finally {
        if (mounted) setChecking(false);
      }
    }
    checkAdmin();
    return () => { mounted = false; };
  }, [router]);

  // Efecto para el contador de órdenes pendientes en tiempo real
  useEffect(() => {
    const getCount = async () => {
      const { count, error } = await supabase
        .from('ordenes')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      if (!error) setPendingOrders(count);
    };

    getCount(); // Fetch inicial

    const channel = supabase
      .channel('public:ordenes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => getCount())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Generar breadcrumbs dinámicamente
  const breadcrumbItems = useMemo(() => {
    const pathParts = pathname.split('/').filter(part => part);
    const items = [{ label: 'Admin', href: '/admin' }];
    pathParts.slice(1).forEach((part, index) => {
      const href = `/admin/${pathParts.slice(1, index + 2).join('/')}`;
      const menuItem = menuItems.find(item => item.path === href);
      items.push({ 
        label: menuItem?.name || part.charAt(0).toUpperCase() + part.slice(1),
        href
      });
    });
    return items;
  }, [pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin border-4 border-yellow-400 border-t-transparent rounded-full w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        data-admin-sidebar="true"
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 text-black rounded flex items-center justify-center font-bold">NBH</div>
            <span className="font-bold">Panel Admin</span>
          </div>
        </div>
        <nav className="p-4 space-y-2 flex-grow">
          {menuItems.map((item) => (
            <SidebarLink
              key={item.path}
              href={item.path}
              label={item.name}
              icon={item.icon}
              badge={item.key === 'ordenes' ? pendingOrders : undefined}
              onClick={() => setSidebarOpen(false)} // Close on click for mobile
            />
          ))}
        </nav>
      </aside>

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64">
        <AdminHeader 
          profile={profile}
          breadcrumbItems={breadcrumbItems}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleSignOut}
        />
        <main className="p-6 bg-gray-50 flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
