'use client';
import { useEffect, useState } from 'react';

export default function BotonWhatsApp({ producto, className = '', label = 'Pedir por WhatsApp' }) {
  const [paginaURL, setPaginaURL] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPaginaURL(window.location.href);
    }
  }, []);

  if (!producto) return null;

  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!numeroWhatsApp) return null; // Si no está configurado, no renderizar el botón

  const mensaje = `Hola, quiero comprar el producto: ${producto.nombre} por $${producto.precio}. Aquí está el enlace: ${paginaURL}`;
  const enlaceWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={enlaceWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-4 rounded-md text-center block transition-colors ${className}`}
    >
      {label}
    </a>
  );
}
