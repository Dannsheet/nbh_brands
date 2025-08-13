'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function CartItem({ item, onRemove, onUpdateQuantity }) {
  const producto = item.productos;
  const [cantidad, setCantidad] = useState(item.cantidad);

  const handleRemove = () => {
    onRemove(item.id);
  };

  const handleChangeCantidad = (newCantidad) => {
    if (newCantidad < 1) return;
    setCantidad(newCantidad);
    onUpdateQuantity(item.id, newCantidad);
  };

  return (
    <div className="flex items-center gap-4 border-b border-gray-700 py-4">
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-800">
        {producto?.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-bold uppercase">{producto?.nombre}</h3>
        <p className="text-sm text-gray-400 uppercase">
          Color: {item.color} | Talla: {item.talla}
        </p>

        <div className="flex items-center mt-2 gap-3">
          <span className="text-sm text-gray-400">CANTIDAD:</span>
          <button
            onClick={() => handleChangeCantidad(cantidad - 1)}
            className="px-2 py-1 text-white border border-gray-500 hover:bg-gray-700 rounded"
            aria-label="Disminuir cantidad"
          >
            −
          </button>
          <span>{cantidad}</span>
          <button
            onClick={() => handleChangeCantidad(cantidad + 1)}
            className="px-2 py-1 text-white border border-gray-500 hover:bg-gray-700 rounded"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="font-bold text-yellow-400">${(producto?.precio || 0) * cantidad}</p>
        <button
          onClick={handleRemove}
          className="p-1 rounded-full text-gray-400 hover:bg-red-900/50 hover:text-red-400 transition-colors duration-200"
          title="Quitar producto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
