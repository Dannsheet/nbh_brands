// src/app/producto/[slug]/page.js
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import InventarioProducto from '@/components/producto/InventarioProducto';
import BotonWhatsApp from '@/components/BotonWhatsApp';

// Función para obtener la URL de la imagen por color
async function fetchImagenPorColor(productoId, color) {
  if (!productoId || !color) return '';
  const { data, error } = await supabase
    .from('imagenes_productos_colores')
    .select('url')
    .eq('producto_id', productoId)
    .ilike('color', color)
    .order('orden', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error('Error obteniendo imagen de color', error);
    return '';
  }
  return data?.url || '';
}

export default function Page() {
  const { slug } = useParams();
  const [producto, setProducto] = useState(null);
  const [imagenesDisponibles, setImagenesDisponibles] = useState([]);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [isAdding, setIsAdding] = useState(false); // Estado para feedback visual
  const [paginaURL, setPaginaURL] = useState('');

  useEffect(() => {
    async function fetchProducto() {
      if (!slug) return;
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        // 1) Normalizar data.imagenes a array de strings
        let imagenesArray = [];
        if (Array.isArray(data.imagenes)) {
          imagenesArray = data.imagenes;
        } else if (typeof data.imagenes === 'string') {
          try {
            const parsed = JSON.parse(data.imagenes);
            imagenesArray = Array.isArray(parsed) ? parsed : [];
          } catch {
            imagenesArray = [];
          }
        }

        // Guardar producto con imagenes normalizadas
        setProducto({ ...data, imagenes: imagenesArray });

        // 2) Carga inicial con prioridad: tabla colores -> producto.imagenes -> variantes -> imagen_url
        let urls = [];
        if (data?.id) {
          const { data: imgs } = await supabase
            .from('imagenes_productos_colores')
            .select('url')
            .eq('producto_id', data.id)
            .order('orden', { ascending: true });
          if (Array.isArray(imgs) && imgs.length) {
            urls = imgs.map((i) => i.url).filter(Boolean);
          }
        }

        if (!urls.length && imagenesArray.length) {
          urls = imagenesArray.filter((u) => typeof u === 'string' && u.length > 0);
        }
        if (!urls.length && Array.isArray(data.variantes) && data.variantes.length) {
          urls = data.variantes.map((v) => v?.imagen_url).filter((u) => typeof u === 'string' && u.length > 0);
        }
        if (!urls.length && data.imagen_url) {
          urls = [data.imagen_url];
        }

        const unique = Array.from(new Set(urls));
        setImagenesDisponibles(unique);
        setIndiceImagen(0);
      } else {
        console.error('Error obteniendo producto', error);
      }
    }
    fetchProducto();
  }, [slug]);

  // Capturar URL actual en cliente para incluirla en el mensaje de WhatsApp
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPaginaURL(window.location.href);
    }
  }, []);

  // Preload de todas las imágenes de variantes
  useEffect(() => {
    if (!producto) return;

    const preloadUrls = async () => {
      // 1) Usar URLs provistas en producto.variantes si existen
      const variantUrls = Array.from(
        new Set(
          (producto?.variantes || [])
            .map((v) => v?.imagen_url)
            .filter((u) => typeof u === 'string' && u.length > 0)
        )
      );

      let urls = variantUrls;

      // 2) Si no hay, consultar todas las imágenes por color en Supabase
      if (urls.length === 0 && producto?.id) {
        const { data, error } = await supabase
          .from('imagenes_productos_colores')
          .select('url')
          .eq('producto_id', producto.id);
        if (!error && Array.isArray(data)) {
          urls = Array.from(
            new Set((data || []).map((r) => r?.url).filter((u) => typeof u === 'string' && u.length > 0))
          );
        }
      }

      // 3) Preload en segundo plano
      if (typeof window !== 'undefined' && urls.length > 0) {
        urls.forEach((u) => {
          try {
            const img = new Image();
            img.src = u;
          } catch (e) {
            // Ignorar errores de preload
          }
        });
      }
    };

    preloadUrls();
  }, [producto]);

  // Preload de las imágenes disponibles del color actual
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(imagenesDisponibles)) return;
    imagenesDisponibles.forEach((u) => {
      try {
        const img = new Image();
        img.src = u;
      } catch (e) {
        // Ignorar errores de preload
      }
    });
  }, [imagenesDisponibles]);

  // Evitar reset de índice cuando la navegación es manual.
  const skipResetRef = useRef(false);
  // Token para evitar aplicar respuestas fuera de orden en cambios de color
  const fetchIdRef = useRef(0);
  useEffect(() => {
    if (!skipResetRef.current) {
      setIndiceImagen(0);
    }
    // limpiar la bandera después de procesar el cambio
    skipResetRef.current = false;
  }, [imagenesDisponibles]);

  // Navegación por teclado: ← → y opcionalmente Esc
  useEffect(() => {
    const onKeyDown = (e) => {
      if (imagenesDisponibles.length <= 0) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipResetRef.current = true;
        setIndiceImagen((prev) => (prev - 1 + imagenesDisponibles.length) % imagenesDisponibles.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipResetRef.current = true;
        setIndiceImagen((prev) => (prev + 1) % imagenesDisponibles.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imagenesDisponibles.length]);

  const handleColorChange = useCallback(async (color) => {
    if (!producto?.id) return;

    const thisFetchId = ++fetchIdRef.current;
    // Cambio por color: queremos reiniciar a la primera imagen.
    skipResetRef.current = false;

    try {
      const { data, error } = await supabase
        .from('imagenes_productos_colores')
        .select('url')
        .eq('producto_id', producto.id)
        .ilike('color', color)
        .order('orden', { ascending: true });

      let urls = [];

      if (!error && Array.isArray(data) && data.length) {
        urls = data.map((img) => img.url).filter(Boolean);
      } else if (Array.isArray(producto?.imagenes) && producto.imagenes.length) {
        const c = String(color || '').toLowerCase();
        urls = producto.imagenes.filter((u) =>
          typeof u === 'string' ? u.toLowerCase().includes(c) : false
        );
      }

      if (!urls.length) {
        if (Array.isArray(producto?.variantes) && producto.variantes.length) {
          urls = producto.variantes.map((v) => v?.imagen_url).filter(Boolean);
        }
        if (!urls.length && producto?.imagen_url) {
          urls = [producto.imagen_url];
        }
      }

      if (thisFetchId === fetchIdRef.current) {
        setImagenesDisponibles(Array.from(new Set(urls)));
        // No seteamos indice aquí; lo hará el efecto si skipResetRef es false.
      }
    } catch (err) {
      console.error('handleColorChange error', err);
    }
  }, [producto]);

  const handleNextImage = () => {
    // Navegación manual: evitar reset
    skipResetRef.current = true;
    setIndiceImagen((prev) => (imagenesDisponibles.length ? (prev + 1) % imagenesDisponibles.length : 0));
  };

  const handlePrevImage = () => {
    skipResetRef.current = true;
    setIndiceImagen((prev) => (imagenesDisponibles.length ? (prev - 1 + imagenesDisponibles.length) % imagenesDisponibles.length : 0));
  };

  const handleAddToCart = async (item) => {
    setIsAdding(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from('carrito').insert([
      {
        usuario_id: user.id,
        producto_id: producto.id,
        color: item.color,
        talla: item.talla,
        cantidad: item.cantidad,
      },
    ]);

    if (error) {
      console.error('Error al agregar al carrito:', error);
      alert('Error al agregar el producto. Inténtalo de nuevo.');
    } else {
      alert('¡Producto agregado al carrito!');
      // Aquí podrías actualizar el estado global del carrito si lo tienes.
    }
    setIsAdding(false);
  };

  if (!producto) {
    return <p className="p-10 text-center">Cargando producto...</p>;
  }

  return (
    <main className="w-full px-4 py-10">
      <div className="mx-auto max-w-6xl flex flex-col lg:flex-row gap-12">
        
        <div className="w-full lg:w-1/2 flex justify-center items-start">
          <div className="relative aspect-square w-full max-w-lg bg-black rounded-lg overflow-hidden shadow-lg">
            {imagenesDisponibles.length > 0 ? (
              <Image
                src={imagenesDisponibles[indiceImagen]}
                alt={producto.nombre}
                fill
                sizes="(min-width: 1024px) 512px, 90vw"
                className="object-cover"
                priority={false}
                unoptimized={imagenesDisponibles[indiceImagen]?.startsWith('http')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <p className="text-gray-500">Imagen no disponible</p>
              </div>
            )}

            {/* Badge visible con posición actual y región aria-live para lectores de pantalla */}
            {imagenesDisponibles.length > 0 && (
              <>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {`Imagen ${indiceImagen + 1} de ${imagenesDisponibles.length}`}
                </div>
                <div aria-live="polite" role="status" className="sr-only">
                  {`Imagen ${indiceImagen + 1} de ${imagenesDisponibles.length}`}
                </div>
              </>
            )}

            {/* Flechas siempre visibles, deshabilitadas si no hay más de una imagen */}
            <button
              onClick={handlePrevImage}
              aria-label="Imagen anterior"
              disabled={imagenesDisponibles.length <= 1}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Imagen siguiente"
              disabled={imagenesDisponibles.length <= 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Indicadores (puntos) */}
            {imagenesDisponibles.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 rounded-full px-2 py-1">
                {imagenesDisponibles.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir a imagen ${i + 1}`}
                    onClick={() => setIndiceImagen(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === indiceImagen ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-white">{producto.nombre}</h1>
          <p className="text-2xl text-yellow-400 font-semibold">${producto.precio}</p>
          <p className="text-base text-gray-300 leading-relaxed">{producto.descripcion}</p>
          
          <div className="border-t border-gray-700 pt-6">
            <InventarioProducto
              productoId={producto.id}
              onAddToCart={handleAddToCart}
              onColorChange={handleColorChange}
              isAdding={isAdding} // Pasamos el estado para deshabilitar el botón si es necesario
              extraButtons={<BotonWhatsApp producto={producto} className="w-full" />}
            />
          </div>
        </div>

      </div>
    </main>
  );
}