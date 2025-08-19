// src/app/admin/ordenes/[id]/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function OrdenDetalleAdminPage() {
  const { id } = useParams(); // id de la orden
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [orden, setOrden] = useState(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    async function fetchOrden() {
      setLoading(true);
      setError(null);
      try {
        // Obtener orden con relaciones:
        // - usuario (nombre,email)
        // - orden_items -> producto
        // - comprobantes_pago
        const { data, error } = await supabase
          .from('ordenes')
          .select(`
            id,
            usuario:usuarios(id, nombre, email),
            estado,
            total,
            fecha,
            orden_items (
              id,
              cantidad,
              precio,
              producto:productos(id, nombre, stock)
            ),
            comprobantes_pago (id, metodo, estado, comprobante_url, fecha)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!mounted) return;
        setOrden(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error cargando la orden');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchOrden();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Refrescar datos
  const refresh = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('ordenes')
        .select(`
          id,
          usuario:usuarios(id, nombre, email),
          estado,
          total,
          fecha,
          orden_items (
            id,
            cantidad,
            precio,
            producto:productos(id, nombre, stock)
          ),
          comprobantes_pago (id, metodo, estado, comprobante_url, fecha)
        `)
        .eq('id', id)
        .single();
      setOrden(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error refrescando');
    } finally {
      setLoading(false);
    }
  };

  // Verificar pago: actualiza comprobante y orden, decrementa stock
  const handleVerificar = async (comprobanteId) => {
    if (!orden) return;
    const comprobante = orden.comprobantes_pago?.find((c) => c.id === comprobanteId);
    if (!comprobante) return alert('Comprobante no encontrado');

    if (!confirm('¿Confirmas verificar este pago y marcar la orden como pagada?')) return;

    setProcessing(true);
    try {
      // 1) Validar stocks antes de aplicar cambios
      for (const item of orden.orden_items) {
        const prod = item.producto;
        const need = Number(item.cantidad || 0);
        const stock = Number(prod?.stock ?? 0);
        if (stock < need) {
          alert(
            `Stock insuficiente para "${prod?.nombre || prod?.id}". Stock actual: ${stock}, requerido: ${need}. Corrige el stock antes de verificar.`
          );
          setProcessing(false);
          return;
        }
      }

      // 2) Actualizar comprobante a 'verificado'
      const { error: compErr } = await supabase
        .from('comprobantes_pago')
        .update({ estado: 'verificado' })
        .eq('id', comprobanteId);

      if (compErr) throw compErr;

      // 3) Actualizar orden a 'pagado'
      const { error: ordErr } = await supabase
        .from('ordenes')
        .update({ estado: 'pagado' })
        .eq('id', orden.id);

      if (ordErr) throw ordErr;

      // 4) Reducir stock por cada item
      for (const item of orden.orden_items) {
        const prodId = item.producto.id;
        const qty = Number(item.cantidad || 0);

        // Obtener stock actual (releer para reducir riesgo de race)
        const { data: prodData, error: prodErr } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', prodId)
          .single();

        if (prodErr) throw prodErr;

        const currentStock = Number(prodData.stock ?? 0);
        const newStock = currentStock - qty;

        const { error: updErr } = await supabase
          .from('productos')
          .update({ stock: newStock })
          .eq('id', prodId);

        if (updErr) throw updErr;
      }

      alert('Pago verificado, orden marcada como PAGADA y stock actualizado.');
      await refresh();
    } catch (err) {
      console.error('Error verificando pago:', err);
      alert('Error verificando pago: ' + (err.message || err));
    } finally {
      setProcessing(false);
    }
  };

  // Rechazar pago: marca comprobante y orden como rechazado
  const handleRechazar = async (comprobanteId) => {
    if (!orden) return;
    if (!confirm('¿Confirmas rechazar este comprobante?')) return;
    setProcessing(true);
    try {
      const { error: compErr } = await supabase
        .from('comprobantes_pago')
        .update({ estado: 'rechazado' })
        .eq('id', comprobanteId);

      if (compErr) throw compErr;

      const { error: ordErr } = await supabase
        .from('ordenes')
        .update({ estado: 'rechazado' })
        .eq('id', orden.id);

      if (ordErr) throw ordErr;

      alert('Comprobante rechazado y orden marcada como RECHAZADA.');
      await refresh();
    } catch (err) {
      console.error('Error rechazando comprobante:', err);
      alert('Error rechazando comprobante: ' + (err.message || err));
    } finally {
      setProcessing(false);
    }
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
                <p className="text-sm text-gray-600">Método: {comprobante.metodo}</p>
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
