// src/components/producto/InventarioProducto.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function InventarioProducto({ productoId, onAddToCart, onColorChange, onVariantSelect, extraButtons = null }) {
  const [inventario, setInventario] = useState([]);
  const [colores, setColores] = useState([]);
  const [tallasDisponibles, setTallasDisponibles] = useState([]);
  const [colorSeleccionado, setColorSeleccionado] = useState('');
  const [tallaSeleccionada, setTallaSeleccionada] = useState('');
  const [cantidadMaxima, setCantidadMaxima] = useState(1);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  // Guard para no duplicar onColorChange en el primer render
  const initialColorRef = useRef(null);
  // Mantener una referencia estable a onColorChange para evitar re-ejecuciones por identidad
  const onColorChangeRef = useRef(onColorChange);
  useEffect(() => {
    onColorChangeRef.current = onColorChange;
  }, [onColorChange]);

  useEffect(() => {
    let mounted = true;
    async function fetchInventario() {
      if (!productoId) return;
      const { data, error } = await supabase
        .from('inventario_productos')
        .select('*')
        .eq('producto_id', productoId)
        .gt('stock', 0);

      if (!error && data && mounted) {
        const stockDisponible = data.filter(item => item.stock > 0);
        setInventario(stockDisponible);
        const coloresUnicos = [...new Set(stockDisponible.map((item) => item.color))];
        setColores(coloresUnicos);
        // Seleccionar el primer color por defecto si existe
        if (coloresUnicos.length > 0) {
          setColorSeleccionado(coloresUnicos[0]);
          // Marcar el color inicial para evitar doble disparo en el siguiente efecto
          initialColorRef.current = coloresUnicos[0];
        }
      } else if (error) {
        console.error('Error obteniendo inventario', error);
      }
    }
    fetchInventario();
    return () => { mounted = false; };
  }, [productoId]);

  useEffect(() => {
    if (colorSeleccionado) {
      const tallas = inventario
        .filter((i) => i.color === colorSeleccionado)
        .map((i) => i.talla);
      setTallasDisponibles(tallas);
      // Mantener talla si sigue disponible; si no, resetear
      setTallaSeleccionada((prev) => (tallas.includes(prev) ? prev : ''));

      // Evitar doble disparo: si es el color inicial, limpiar ref sin volver a llamar
      if (initialColorRef.current && colorSeleccionado === initialColorRef.current) {
        initialColorRef.current = null;
      } else if (onColorChangeRef.current && colorSeleccionado !== '') {
        onColorChangeRef.current(colorSeleccionado);
      }
    }
  }, [colorSeleccionado, inventario]);

  useEffect(() => {
    if (tallaSeleccionada) {
        const item = inventario.find(
            (i) => i.color === colorSeleccionado && i.talla === tallaSeleccionada
        );
        if (item) {
            setCantidadMaxima(item.stock);
            setCantidadSeleccionada(1);
            if(onVariantSelect) onVariantSelect(item);
        }
    }
  }, [tallaSeleccionada, colorSeleccionado, inventario, onVariantSelect]);

  const agregarAlCarrito = () => {
    if (!colorSeleccionado || !tallaSeleccionada || !cantidadSeleccionada) {
      alert('Selecciona color, talla y cantidad');
      return;
    }
    onAddToCart({
      color: colorSeleccionado,
      talla: tallaSeleccionada,
      cantidad: cantidadSeleccionada,
    });
  };

  return (
    <div className="space-y-6">
      {/* Color */}
      <div>
        <label className="text-sm font-semibold text-gray-400 uppercase">Color</label>
        <div className="flex gap-2 flex-wrap mt-2">
          {colores.map((c) => (
            <button
              key={c}
              className={`px-4 py-2 border uppercase text-sm rounded-md transition-colors min-w-[48px] min-h-[48px] ${
                c === colorSeleccionado
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-black text-white border-gray-600 hover:border-gray-400'
              }`}
              onClick={() => setColorSeleccionado(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Talla */}
      {colorSeleccionado && (
        <div>
          <label className="text-sm font-semibold text-gray-400 uppercase">Talla</label>
          <div className="flex gap-2 flex-wrap mt-2">
            {tallasDisponibles.length > 0 ? tallasDisponibles.map((t) => (
              <button
                key={t}
                className={`px-4 py-2 border uppercase text-sm rounded-md transition-colors min-w-[48px] min-h-[48px] ${
                  t === tallaSeleccionada
                    ? 'bg-yellow-400 text-black border-yellow-400'
                    : 'bg-black text-white border-gray-600 hover:border-gray-400'
                }`}
                onClick={() => setTallaSeleccionada(t)}
              >
                {t}
              </button>
            )) : <p className="text-sm text-gray-500">No hay tallas para este color.</p>}
          </div>
        </div>
      )}

      {/* Cantidad */}
      {tallaSeleccionada && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-400 uppercase">Cantidad</label>
          <select
            className="bg-black border border-gray-600 p-3 rounded-md text-white w-full max-w-xs"
            value={cantidadSeleccionada}
            onChange={(e) => setCantidadSeleccionada(Number(e.target.value))}
          >
            {Array.from({ length: cantidadMaxima }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={agregarAlCarrito}
        disabled={!colorSeleccionado || !tallaSeleccionada}
        className="w-full bg-yellow-400 text-black font-bold px-6 py-4 rounded-md hover:bg-yellow-500 transition-colors disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        AGREGAR AL CARRITO
      </button>

      {extraButtons && (
        <div>
          {extraButtons}
        </div>
      )}
    </div>
  );
}