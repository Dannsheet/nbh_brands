import createSupabaseServer from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = createSupabaseServer();

  // Get statistics
  const [
    { count: productsCount },
    { count: ordersCount },
    { count: usersCount },
  ] = await Promise.all([
    supabase
      .from('productos')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', new Date().toISOString().split('T')[0]), // Today's orders
    supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { name: 'Productos', value: productsCount || 0, icon: '👕' },
    { name: 'Pedidos Hoy', value: ordersCount || 0, icon: '📦' },
    { name: 'Usuarios', value: usersCount || 0, icon: '👥' },
  ];

  const quickActions = [
    { name: 'Agregar Producto', href: '/admin/productos/nuevo', icon: '➕' },
    { name: 'Ver Inventario', href: '/admin/inventario', icon: '📊' },
    { name: 'Ver Ventas', href: '/admin/ventas', icon: '💰' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="bg-white grid grid-cols-1 gap-5 p-6 sm:grid-cols-3">
          {quickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <span className="text-white text-xl">{action.icon}</span>
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-gray-900">{action.name}</h4>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-4">
            Próximamente: Actividad reciente de pedidos y actualizaciones
          </p>
        </div>
      </div>
    </div>
  );
}

// This ensures the page is dynamic and always fetches fresh data
export const dynamic = 'force-dynamic';
