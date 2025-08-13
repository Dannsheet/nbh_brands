// src/app/carrito/page.js
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import CartItem from '@/components/cart/CartItem';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function CarritoPage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR('/api/carrito', fetcher);

  useEffect(() => {
    if (error?.status === 401) {
      router.push('/login?redirectedFrom=/carrito');
    }
  }, [error, router]);

  const items = data?.items || [];

  const handleRemoveItem = async (itemId) => {
    // Actualización optimista: eliminamos el item de la UI inmediatamente
    const updatedItems = items.filter((item) => item.id !== itemId);
    mutate({ items: updatedItems }, false); // El `false` evita una revalidación inmediata

    try {
      await fetch('/api/carrito', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
    } finally {
      // Revalidamos para asegurar que el estado local es consistente con el servidor
      mutate();
    }
  };

  const handleUpdateQuantity = async (itemId, newCantidad) => {
    // Actualización optimista
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, cantidad: newCantidad } : item
    );
    mutate({ items: updatedItems }, false);

    try {
      await fetch('/api/carrito', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, cantidad: newCantidad }),
      });
    } finally {
      mutate();
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item?.productos?.precio || 0) * item.cantidad, 0);

  if (isLoading) return <p className="p-6 text-center text-gray-400 uppercase">Cargando carrito...</p>;

  if (error && error.status !== 401) {
    return <p className="p-6 text-center text-red-500">Error al cargar el carrito. Inténtalo de nuevo.</p>;
  }

  // No renderizar nada si estamos a punto de redirigir
  if (error?.status === 401) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6 uppercase">Tu Carrito</h1>
      {items.length === 0 ? (
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 uppercase">Tu carrito está vacío</h2>
          <p className="text-gray-400 mb-6">Parece que no has añadido nada aún.</p>
          <Link href="/" className="bg-yellow-400 text-black font-bold py-2 px-6 rounded hover:bg-yellow-500 transition-colors uppercase">
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4 uppercase">Resumen del Pedido</h2>
            <div className="flex justify-between text-gray-300 mb-2">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300 mb-4">
              <span>Envío</span>
              <span className="uppercase">Calculado en el checkout</span>
            </div>
            <div className="border-t border-gray-700 pt-4 flex justify-between font-bold text-white text-lg">
              <span className="uppercase">Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button className="mt-6 w-full bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-500 transition-colors uppercase">
              Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
