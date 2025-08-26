'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { FiSearch, FiDownload, FiEdit2, FiSave, FiX, FiTrash2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Link from 'next/link';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import toast from 'react-hot-toast';
import { fetchSafe } from '@/lib/fetchSafe';

const DEBOUNCE_DELAY = 300; // ms

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [tempStock, setTempStock] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [sortBy, setSortBy] = useState([{ id: 'producto.nombre', desc: false }, { id: 'color', desc: false }]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);

      const sortString = sortBy.map(s => `${s.desc ? '-' : ''}${s.id}`).join(',');
      if (sortString) params.append('sort_by', sortString);

      const res = await fetchSafe(`/api/admin/inventario?${params.toString()}`);
      if (res.error) throw new Error(res.error);
      // Normalizar distintos shapes posibles:
      const apiBody = res.data ?? null;
      const inventoryList = apiBody?.data ?? apiBody ?? [];
      const totalFromMeta = apiBody?.meta?.total ?? res.meta?.total ?? 0;
      setInventory(inventoryList);
      setPagination(prev => ({ ...prev, total: Number(totalFromMeta || 0) }));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('No se pudo cargar el inventario.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, sortBy]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Group inventory by product and calculate total stock
  const inventoryByProduct = useMemo(() => {
    const grouped = {};
    
    inventory.forEach(item => {
      const productId = item.producto.id;
      if (!grouped[productId]) {
        grouped[productId] = {
          id: productId,
          nombre: item.producto?.nombre || 'Producto sin nombre',
          slug: item.producto?.slug || '',
          items: [],
          totalStock: 0
        };
      }
      
      grouped[productId].items.push({
        id: item.id,
        color: item.color,
        talla: item.talla,
        stock: item.stock
      });
      
      grouped[productId].totalStock += item.stock;
    });
    
    return Object.values(grouped);
  }, [inventory]);

  // Client-side filtering is no longer the primary method, but can be kept for instant feedback
  const filteredProducts = useMemo(() => {
    // The API now handles filtering, so this might just return inventoryByProduct directly
    // or be removed if server-side filtering is sufficient.
    return inventoryByProduct;
  }, [inventoryByProduct]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Slug', 'Color', 'Talla', 'Stock'];
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    Object.values(inventoryByProduct).forEach(product => {
      product.items.forEach(item => {
        const row = [
          `"${product.nombre.replace(/"/g, '""')}"`,
          `"${product.slug}"`,
          `"${item.color}"`,
          `"${item.talla}"`,
          item.stock
        ];
        csvRows.push(row.join(','));
      });
    });
    
    // Create CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle stock update
  const handleUpdateStock = async (itemId, newStock) => {
    try {
      const { error } = await fetchSafe(`/api/admin/inventario/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: parseInt(newStock, 10) })
      });
      
      if (error) throw error;
      
      // Update local state
      setInventory(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, stock: parseInt(newStock, 10) } : item
        )
      );
      
      setEditingItem(null);
      toast.success('Stock actualizado correctamente');
      await fetchInventory(); // Refresh data
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar el stock');
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await fetchSafe(`/api/admin/inventario/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      toast.success('Variante eliminada correctamente');
      await fetchInventory(); // Refresh data
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar la variante');
    } finally {
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold uppercase" style={{ color: 'rgb(250 204 21 / var(--tw-bg-opacity, 1))' }}>Inventario</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/admin/inventario/nuevo" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <FiPlus className="mr-2 h-4 w-4" />
            Añadir item
          </Link>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 uppercase">
            Gestión de Inventario
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Visualiza y gestiona el inventario de productos por color y talla.
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredProducts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No se encontraron productos que coincidan con la búsqueda.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {product.nombre}
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mt-2 sm:mt-0">
                    Stock total: {product.totalStock} unidades
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Color
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Talla
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {product.items.map((item) => (
                        <tr key={`${item.color}-${item.talla}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <div 
                                className="h-4 w-4 rounded-full mr-2 border border-gray-300"
                                style={{ backgroundColor: item.color.toLowerCase() }}
                                title={item.color}
                              />
                              {item.color}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.talla.toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingItem === item.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  className="block w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={tempStock}
                                  onChange={(e) => setTempStock(e.target.value)}
                                  min="0"
                                />
                                <button
                                  onClick={() => handleUpdateStock(item.id, tempStock)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <FiSave className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingItem(null)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <FiX className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.stock < 5 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {item.stock} unidades
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingItem(item.id);
                                    setTempStock(item.stock);
                                  }}
                                  className="ml-2 text-indigo-600 hover:text-indigo-900"
                                  title="Editar stock"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleDeleteClick(item)} className="text-red-600 hover:text-red-900">
                              <FiTrash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la variante ${itemToDelete?.color} - ${itemToDelete?.talla}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
