// src/app/admin/usuarios/[id]/direcciones/page.js
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DireccionesUsuario() {
  const { id } = useParams();
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDirecciones = async () => {
      const { data, error } = await supabase
        .from('direcciones_envio')
        .select('*')
        .eq('usuario_id', id);

      if (error) {
        console.error('Error al cargar direcciones:', error.message);
      } else {
        setDirecciones(data);
      }
      setLoading(false);
    };

    if (id) cargarDirecciones();
  }, [id]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Direcciones del Usuario</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : direcciones.length === 0 ? (
        <p>Este usuario no tiene direcciones registradas.</p>
      ) : (
        <ul className="space-y-4">
          {direcciones.map((dir) => (
            <li key={dir.id} className="p-4 border rounded-lg bg-gray-900">
              <p><strong>Receptor:</strong> {dir.nombre_receptor}</p>
              <p><strong>Cédula:</strong> {dir.cedula || 'No especificada'}</p>
              <p><strong>Celular:</strong> {dir.celular}</p>
              <p><strong>Ciudad:</strong> {dir.ciudad}</p>
              <p><strong>Dirección:</strong> {dir.direccion}</p>
              <p><strong>Referencias:</strong> {dir.referencias || 'Ninguna'}</p>
              <p><strong>Predeterminada:</strong> {dir.predeterminada ? 'Sí' : 'No'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
