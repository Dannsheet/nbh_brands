'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrdenDetalleAdminPage() {
  const { id } = useParams(); // id de la orden
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState(null);

  const fetchOrden = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error, status } = await fetchSafe(`/api/admin/ordenes/${id}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error cargando la orden');
      }
      const { data } = await response.json();
      setOrden(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrden();
  }, [fetchOrden]);

  // Refrescar datos
  const refresh = () => fetchOrden();

  const handleUpdateStatus = async (action, comprobanteId) => {
    if (!orden) return;

    const confirmText = action === 'verify'
      ? '¿Confirmas verificar este pago y marcar la orden como pagada?'
      : '¿Confirmas rechazar este comprobante?';

    if (!confirm(confirmText)) return;

    setProcessing(true);
    try {
      const { data, error, status } = await fetchSafe(`/api/admin/ordenes/${orden.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comprobanteId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error');
      }

      toast.success(result.message || 'Operación exitosa');
      await refresh();
    } catch (err) {
      console.error(`Error processing action ${action}:`, err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Verificar pago: actualiza comprobante y orden, decrementa stock
  const handleVerificar = (comprobanteId) => {
    if (!orden?.comprobantes_pago?.find((c) => c.id === comprobanteId)) {
      return toast.error('Comprobante no encontrado');
    }
    handleUpdateStatus('verify', comprobanteId);
  };

  // Rechazar pago: marca comprobante y orden como rechazado
  const handleRechazar = (comprobanteId) => {
    if (!orden?.comprobantes_pago?.find((c) => c.id === comprobanteId)) {
      return toast.error('Comprobante no encontrado');
    }
    handleUpdateStatus('reject', comprobanteId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando orden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error: {error}</p>
        <Link href="/admin/ordenes" className="text-blue-400 hover:underline">Volver a órdenes</Link>
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Orden no encontrada.</p>
        <Link href="/admin/ordenes" className="text-blue-400 hover:underline">Volver a órdenes</Link>
      </div>
    );
  }

  const comprobante = orden.comprobantes_pago?.[0] ?? null;

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orden #{orden.id}</h1>
        <Link href="/admin/ordenes" className="text-sm text-blue-400 hover:underline">← Volver</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Cliente</h2>
            <p>{orden.usuario?.nombre || '-'}</p>
            <p className="text-sm text-gray-500">{orden.usuario?.email || '-'}</p>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Ítems</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th>Producto</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {orden.orden_items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2">{it.producto?.nombre || it.producto?.id}</td>
                    <td className="py-2 text-right">{it.cantidad}</td>
                    <td className="py-2 text-right">${Number(it.precio).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right font-bold">Total: ${Number(orden.total).toFixed(2)}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Estado</h3>
            <div className="mt-2">
              <span className={`px-2 py-1 rounded text-sm ${
                orden.estado === 'pagado' ? 'bg-green-600 text-white' :
                orden.estado === 'pendiente' ? 'bg-yellow-600 text-white' :
                orden.estado === 'rechazado' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
              }`}>{orden.estado}</span>
            </div>
            <div className="mt-3 text-sm text-gray-500">Fecha: {new Date(orden.fecha).toLocaleString()}</div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Comprobante</h3>
            {comprobante ? (
              <>
                <p className="text-sm text-gray-600">Método: {comprobante.metodo_pago}</p>
                <p className="text-sm text-gray-600">Estado: {comprobante.estado}</p>

                <div className="mt-3">
                  {/* Si la URL es una signedUrl, abrirá; en caso contrario, intenta abrir la URL guardada */}
                  <a href={comprobante.comprobante_url} target="_blank" rel="noreferrer" className="inline-block text-blue-400 hover:underline">
                    Abrir comprobante
                  </a>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    disabled={processing || comprobante.estado === 'verificado'}
                    onClick={() => handleVerificar(comprobante.id)}
                    className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                  >
                    {processing ? 'Procesando...' : 'Verificar pago'}
                  </button>
                  <button
                    disabled={processing || comprobante.estado === 'rechazado'}
                    onClick={() => handleRechazar(comprobante.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                  >
                    Rechazar comprobante
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No hay comprobante asociado.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
