// src/app/admin/usuarios/page.js
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res = await fetch('/api/admin/usuarios');
        const json = await res.json();
        setUsuarios(json.usuarios || []);
      } catch (err) {
        console.error(err);
        setError('Error al cargar usuarios');
      }
    }
    fetchUsuarios();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Usuarios registrados</h1>
      <table className="min-w-full bg-white text-black">
        <thead>
          <tr>
            <th className="border px-4 py-2">Nombre</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Rol</th>
            <th className="border px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td className="border px-4 py-2">{u.nombre || '—'}</td>
              <td className="border px-4 py-2">{u.email || '—'}</td>
              <td className="border px-4 py-2">{u.rol || 'cliente'}</td>
              <td className="border px-4 py-2">
                <Link
                  href={`/admin/usuarios/${u.id}/direcciones`}
                  className="text-blue-600 hover:underline"
                >
                  Ver direcciones
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
