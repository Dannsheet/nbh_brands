'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import toast from 'react-hot-toast';
import { fetchSafe } from '@/lib/fetchSafe';

export default function ProductActions({ product }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    try {
      const res = await fetchSafe(`/api/admin/productos?id=${product.id}`, {
        method: 'DELETE',
      });

      if (res.error || res.status !== 200) {
        throw new Error(res.error || 'Error al eliminar el producto');
      }

      setIsModalOpen(false);
      toast.success('Producto eliminado correctamente');
      router.refresh(); // Recargar la página para ver los cambios
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(`Error: ${error.message}`);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Button
        className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400 min-w-[100px]"
        size="sm"
        asChild
      >
        <Link
          href={`/admin/productos/${product.id}/editar`}
        >
          <FiEdit className="mr-2 h-4 w-4" />
          Editar
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        <FiTrash2 className="mr-2 h-4 w-4" />
        Eliminar
      </Button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}
