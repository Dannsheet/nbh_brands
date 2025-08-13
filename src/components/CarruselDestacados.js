'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function CarruselDestacados() {
  const [destacados, setDestacados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDestacados() {
      try {
        const res = await fetch('/api/productos/destacados');
        if (!res.ok) throw new Error('Error fetch');
        const productos = await res.json();
        setDestacados(productos);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDestacados();
  }, []);

  if (loading) {
    return <div className="py-10 text-center text-gray-400">Cargando destacados...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-500">No se pudieron cargar los productos destacados.</div>;
  }

  return (
    <div className="relative w-full overflow-x-auto flex gap-4 p-4">
      {destacados.map(producto => (
        <Link
          key={producto.id}
          href={`/producto/${producto.slug}`}
          className="group relative min-w-[300px] block"
        >
          <Image
            src={producto.imagenes?.[0] || '/placeholder.png'}
            alt={producto.nombre}
            width={300}
            height={400}
            className="rounded-lg object-cover w-full h-[400px] transition-transform duration-300 ease-out group-hover:scale-105"
            priority={false}
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end rounded-lg bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="p-4 text-center text-white space-y-1">
              <p className="text-lg font-semibold tracking-wide">{producto.nombre}</p>
              <p className="text-sm text-yellow-400 font-bold">${producto.precio}</p>
              <span className="inline-block mt-2 rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-black">Comprar ahora</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
