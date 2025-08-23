"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

// El componente de la tarjeta de producto que maneja su propio estado y estilo
export default function ProductoCard({ producto }) {
  const router = useRouter();

  // Colores únicos desde variantes del backend (evitar duplicados y valores inválidos)
  const uniqueColors = Array.from(
    new Set(
      (producto?.variantes || [])
        .map((v) => (v && typeof v.color === "string" ? v.color.trim() : ""))
        .filter((c) => c)
    )
  );

  // Imagen principal y secundaria para hover
  const imagenPrincipal = producto.imagen_principal || producto.imagenes?.[0] || "/placeholder.png";
  const imagenSecundaria = (() => {
    // Priorizar imagen distinta a la principal desde variantes
    const fromVariantes = (producto?.variantes || [])
      .map((v) => v?.imagen_url)
      .filter((u) => typeof u === "string" && u.length > 0 && u !== imagenPrincipal);
    if (fromVariantes.length > 0) return fromVariantes[0];
    // Fallback a una segunda imagen del arreglo si existe y es distinta
    const fallback = producto?.imagenes?.[1];
    return typeof fallback === "string" && fallback !== imagenPrincipal ? fallback : '';
  })();

  // Preload de imagen secundaria para evitar parpadeos
  useEffect(() => {
    if (imagenSecundaria && typeof window !== "undefined") {
      const img = new window.Image();
      img.src = imagenSecundaria;
    }
  }, [imagenSecundaria]);

  return (
    <div
      className="group cursor-pointer flex flex-col h-full"
      onClick={() => router.push(`/producto/${producto.slug || producto.id}`)}
    >
      {/* Contenedor de imagen con proporción 4:5 y hover swap */}
      <div className="relative w-full pb-[125%] bg-gray-900 rounded overflow-hidden shadow-lg transition-shadow duration-300 ease-in-out group-hover:shadow-xl">
        {/* Imagen principal */}
        <NextImage
          src={imagenPrincipal}
          alt={producto.nombre}
          fill
          sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
          priority={false}
          loading="lazy"
          className={`object-cover transition-opacity duration-500 ease-in-out ${imagenSecundaria ? 'group-hover:opacity-0' : ''}`}
        />
        {/* Imagen secundaria superpuesta para hover */}
        {imagenSecundaria ? (
          <NextImage
            src={imagenSecundaria}
            alt={`${producto.nombre} secundario`}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            priority={false}
            loading="lazy"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100"
          />
        ) : null}
      </div>

      {/* Información del producto */}
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="text-white uppercase font-bold text-lg leading-tight line-clamp-2 text-center">{producto.nombre}</h3>
        {/* Precio centrado debajo de la imagen */}
        <p className="text-yellow-400 font-bold text-center mt-2">${producto.precio}</p>
        {/* Círculos de colores debajo del precio, centrados */}
        {uniqueColors.length > 0 ? (
          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
            {uniqueColors.map((color) => {
              // Validar si el color es soportado por CSS; si no, usar un fallback
              const isSupported = typeof window !== 'undefined' && CSS?.supports?.('color', color);
              const bg = isSupported ? color : '#9ca3af'; // gray-400 fallback
              return (
                <div
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: bg }}
                  title={color}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            })}
          </div>
        ) : null}
        {/* Se eliminan tallas y selector de color en vista previa, así como el botón de agregar */}
      </div>
    </div>
  );
}
