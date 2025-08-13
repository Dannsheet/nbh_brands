'use client';

import { useState } from 'react';

export default function RastrearPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      alert('Por favor, ingresa un número de seguimiento.');
      return;
    }
    // Lógica de simulación de búsqueda
    setTrackingInfo({
      status: 'En tránsito',
      location: 'Centro de distribución, Ciudad Capital',
      estimatedDelivery: '2 días hábiles',
    });
    console.log('Buscando seguimiento para:', trackingNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-center mb-8 uppercase">
        Rastrear mi Producto
      </h1>
      <form onSubmit={handleTrack} className="flex flex-col items-center gap-4">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Ingresa tu código de seguimiento"
          className="w-full p-3 border border-gray-300 rounded-md text-black"
        />
        <button
          type="submit"
          className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors"
        >
          Rastrear
        </button>
      </form>

      {trackingInfo && (
        <div className="mt-8 p-6 border border-gray-200 rounded-md bg-gray-50 text-black">
          <h2 className="text-2xl font-semibold mb-4">Estado del Envío</h2>
          <p><strong>Estado:</strong> {trackingInfo.status}</p>
          <p><strong>Ubicación actual:</strong> {trackingInfo.location}</p>
          <p><strong>Entrega estimada:</strong> {trackingInfo.estimatedDelivery}</p>
        </div>
      )}
    </div>
  );
}