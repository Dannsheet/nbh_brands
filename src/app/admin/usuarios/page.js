// src/app/admin/usuarios/page.js
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import toast from 'react-hot-toast';
import { fetchSafe } from '@/lib/fetchSafe';

export default function UsuariosPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Usuarios registrados</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <UsuariosTable />
      </div>
    </div>
  );
}

function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetchSafe('/api/admin/usuarios');
      if (res.error) throw new Error(res.error);
      // Normalizar distintos shapes posibles:
      const apiBody = res.data ?? null;
      const usuariosList = apiBody?.usuarios ?? apiBody ?? [];
      setUsuarios(usuariosList);
    } catch (err) {
      console.error(err);
      setError('Error al cargar usuarios');
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const { error: deleteError } = await fetchSafe(`/api/admin/usuarios?id=${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (deleteError) throw new Error(deleteError);

      toast.success('Usuario eliminado correctamente');
      // Refresh user list
      await fetchUsuarios();
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsModalOpen(false);
      setUserToDelete(null);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar al usuario ${userToDelete?.nombre || userToDelete?.email}? Esta acción no se puede deshacer.`}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.nombre || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.rol || 'cliente'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/usuarios/${u.id}/direcciones`}
                    className="text-blue-600 hover:underline"
                  >
                    Ver direcciones
                  </Link>
                  <Link href={`/admin/usuarios/${u.id}/editar`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <FiEdit className="inline h-5 w-5" />
                  </Link>
                  <button onClick={() => handleDeleteClick(u)} className="text-red-600 hover:text-red-900">
                    <FiTrash2 className="inline h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
