'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function ProductoPage() {
  const { slug } = useParams();
  const [producto, setProducto] = useState(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function fetchProducto() {
      const res = await fetch(`/api/productos/${slug}`);
      const data = await res.json();
      setProducto(data);
    }
    fetchProducto();
  }, [slug]);

  const agregarAlCarrito = () => {
    if (!tallaSeleccionada) {
      setMensaje('Selecciona una talla primero.');
      return;
    }
    // Aquí iría la lógica real para agregar al carrito
    console.log(`Agregado al carrito: ${producto.nombre}, talla ${tallaSeleccionada}`);
    setMensaje('Producto agregado al carrito.');
  };

  if (!producto) return <p className="text-white p-6">Cargando producto...</p>;

  return (
    <div className="p-6 text-white">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Image
            src={producto.imagenes[0]}
            alt={producto.nombre}
            width={500}
            height={600}
            className="rounded-lg object-cover w-full h-auto"
          />
          {producto.imagenes.length > 1 && (
            <div className="flex gap-2 mt-2">
              {producto.imagenes.slice(1).map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`Vista ${i + 2}`}
                  width={80}
                  height={80}
                  className="rounded object-cover border border-gray-600"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>
          <p className="text-lg mb-2 text-secondary">${producto.precio}</p>
          <p className="text-sm mb-4 text-gray-300">{producto.descripcion}</p>

          <div className="mb-4">
            <label className="block mb-1 text-sm">Selecciona talla:</label>
            <div className="flex gap-2 flex-wrap">
              {producto.tallas.map(talla => (
                <button
                  key={talla}
                  onClick={() => setTallaSeleccionada(talla)}
                  className={`border px-4 py-1 rounded-full ${
                    tallaSeleccionada === talla ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'
                  }`}
                >
                  {talla.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={agregarAlCarrito}
            className="bg-yellow-400 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-300 transition"
          >
            Agregar al carrito
          </button>

          {mensaje && <p className="mt-2 text-sm text-green-400">{mensaje}</p>}
        </div>
      </div>
    </div>
  );
}
