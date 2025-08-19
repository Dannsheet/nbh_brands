'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function OrdenesAdminPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const { data, error } = await supabase
          .from('ordenes')
          .select(`
            id,
            usuario:usuarios(nombre, email),
            estado,
            total,
            fecha,
            comprobantes_pago (metodo, estado)
          `)
          .order('fecha', { ascending: false });

        if (error) throw error;
        setOrdenes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdenes();
  }, []);

  if (loading) return <p className="p-6 text-gray-400">Cargando órdenes...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <section className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📦 Órdenes</h1>

      {ordenes.length === 0 ? (
        <p className="text-gray-400">No hay órdenes registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-900 text-gray-300">
              <tr>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2">Email</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Total</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Método Pago</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-2">{orden.usuario?.nombre || '—'}</td>
                  <td className="p-2">{orden.usuario?.email || '—'}</td>
                  <td className="p-2">{new Date(orden.fecha).toLocaleString()}</td>
                  <td className="p-2 font-bold text-yellow-400">${orden.total.toFixed(2)}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          orden.estado === 'pagado'
                            ? 'bg-green-600 text-white'
                            : orden.estado === 'pendiente'
                            ? 'bg-yellow-600 text-white'
                            : orden.estado === 'rechazado'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                    >
                      {orden.estado}
                    </span>
                  </td>
                  <td className="p-2">
                    {orden.comprobantes_pago?.[0]?.metodo || '—'} (
                    {orden.comprobantes_pago?.[0]?.estado || '—'})
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/ordenes/${orden.id}`}
                      className="text-blue-400 hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
