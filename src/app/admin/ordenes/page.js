'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { fetchSafe } from '@/lib/fetchSafe';

const DEBOUNCE_DELAY = 500;

export default function OrdenesAdminPage() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [sortBy, setSortBy] = useState([{ id: 'fecha', desc: true }]);
  const [filters, setFilters] = useState({ email: '', estado: '' });
  const [debouncedEmail, setDebouncedEmail] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEmail(filters.email);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(handler);
  }, [filters.email]);

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (debouncedEmail) params.append('email', debouncedEmail);
      if (filters.estado) params.append('estado', filters.estado);

      const sortString = sortBy.map(s => `${s.desc ? '-' : ''}${s.id}`).join(',');
      if (sortString) params.append('sort_by', sortString);

      const res = await fetchSafe(`/api/admin/ordenes?${params.toString()}`);
      if (res.error) throw new Error(res.error);
      // Soportar ambas formas de respuesta
      const apiBody = res.data ?? null;
      const ordenesList = apiBody?.data ?? apiBody ?? [];
      const totalFromMeta = apiBody?.meta?.total ?? res.meta?.total ?? 0;
      setOrdenes(ordenesList);
      setPagination(prev => ({ ...prev, total: Number(totalFromMeta || 0) }));
      setError(null);
    } catch (err) {
      setError(err.message);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedEmail, filters.estado, sortBy]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  const handleSort = (columnId) => {
    setSortBy(prev => {
      const existing = prev.find(s => s.id === columnId);
      if (existing) {
        if (!existing.desc) {
          return prev.map(s => s.id === columnId ? { ...s, desc: true } : s);
        } else {
          return prev.filter(s => s.id !== columnId);
        }
      } else {
        return [...prev, { id: columnId, desc: false }];
      }
    });
  };

  const SortableHeader = ({ children, columnId }) => {
    const sortConfig = sortBy.find(s => s.id === columnId);
    const isSorting = !!sortConfig;
    const isDesc = sortConfig?.desc || false;

    return (
      <th className="p-2 text-left cursor-pointer select-none" onClick={() => handleSort(columnId)}>
        <div className="flex items-center">
          {children}
          <span className="ml-2">
            {isSorting ? (
              isDesc ? <FiArrowDown className="h-4 w-4" /> : <FiArrowUp className="h-4 w-4" />
            ) : (
              <FiArrowUp className="h-4 w-4 text-gray-600" />
            )}
          </span>
        </div>
      </th>
    );
  };

  if (loading) return <p className="p-6 text-gray-400">Cargando órdenes...</p>;
  if (error && !loading) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">📦 Órdenes</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 p-4 bg-gray-900 rounded-lg">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={filters.email}
          onChange={(e) => setFilters(prev => ({ ...prev, email: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white w-full sm:w-auto"
        />
        <select
          value={filters.estado}
          onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
          className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white w-full sm:w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
          <option value="rechazado">Rechazado</option>
        </select>
      </div>

      {ordenes.length === 0 ? (
        <p className="text-gray-400">No hay órdenes que coincidan con los filtros.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700 text-sm">
            <thead className="bg-gray-900 text-gray-300">
              <tr>
                <SortableHeader columnId="usuarios.nombre">Cliente</SortableHeader>
                <SortableHeader columnId="usuarios.email">Email</SortableHeader>
                <SortableHeader columnId="fecha">Fecha</SortableHeader>
                <SortableHeader columnId="total">Total</SortableHeader>
                <SortableHeader columnId="estado">Estado</SortableHeader>
                <th className="p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-2 text-black">{orden.usuario?.nombre || '—'}</td>
                  <td className="p-2 text-black">{orden.usuario?.email || '—'}</td>
                  <td className="p-2">{new Date(orden.fecha).toLocaleString()}</td>
                  <td className="p-2 font-bold text-black">${orden.total.toFixed(2)}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          orden.estado === 'pagado' || orden.estado === 'entregado'
                            ? 'bg-green-600 text-white'
                            : orden.estado === 'pendiente'
                            ? 'bg-yellow-600 text-white'
                            : orden.estado === 'enviado'
                            ? 'bg-blue-600 text-white'
                            : orden.estado === 'rechazado' || orden.estado === 'cancelado'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                    >
                      {orden.estado}
                    </span>
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

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-400">
          Mostrando {ordenes.length} de {pagination.total} órdenes
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page * pagination.limit >= pagination.total}
            className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
