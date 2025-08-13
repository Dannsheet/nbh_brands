import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Productos', path: '/admin/productos', icon: '👕' },
    { name: 'Inventario', path: '/admin/inventario', icon: '📦' },
    { name: 'Ventas', path: '/admin/ventas', icon: '💵' },
    { name: 'Calendario', path: '/admin/calendario', icon: '📅' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          
          <nav className="mt-6">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path} className="mb-2">
                  <Link 
                    href={item.path}
                    className={`flex items-center p-3 rounded-lg hover:bg-gray-700 ${router.pathname === item.path ? 'bg-gray-700' : ''}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="mt-8">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center p-3 text-red-400 hover:bg-gray-700 rounded-lg"
                >
                  <span className="mr-3">🚪</span>
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <header className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => router.pathname === item.path)?.name || 'Panel de Administración'}
            </h2>
          </header>
          
          <main className="bg-white rounded-lg shadow-sm p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
