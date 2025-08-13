// /app/productos/page.js
import Image from "next/image";
import Link from "next/link";

async function getProductos() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/productos`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function TodosLosProductos() {
  const productos = await getProductos();

  return (
    <section className="p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Todos los Productos</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <Link
            key={producto.id}
            href={`/producto/${producto.slug}`}
            className="bg-gray-900 rounded-lg overflow-hidden shadow hover:shadow-lg transition"
          >
            <Image
              src={producto.imagenes?.[0] || '/placeholder.jpg'}
              alt={producto.nombre}
              width={400}
              height={400}
              className="w-full h-60 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white">{producto.nombre}</h3>
              <p className="text-yellow-400 font-bold">${producto.precio}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
