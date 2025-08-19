'use client';

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FiSearch, FiDownload, FiEdit2, FiSave, FiX } from 'react-icons/fi';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [tempStock, setTempStock] = useState('');

  // Fetch inventory data on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const { data, error } = await supabase
          .from('inventario_productos')
          .select(`
            id,
            producto_id,
            color,
            talla,
            stock,
            productos:producto_id(nombre, slug)
          `)
          .order('productos.nombre', { ascending: true })
          .order('color', { ascending: true })
          .order('talla', { ascending: true });

        if (error) throw error;
        setInventory(data || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Group inventory by product and calculate total stock
  const inventoryByProduct = useMemo(() => {
    const grouped = {};
    
    inventory.forEach(item => {
      const productId = item.producto_id;
      if (!grouped[productId]) {
        grouped[productId] = {
          id: productId,
          nombre: item.productos?.nombre || 'Producto sin nombre',
          slug: item.productos?.slug || '',
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
    
    return grouped;
  }, [inventory]);

  // Filter products by search term
  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return Object.values(inventoryByProduct).filter(product => 
      product.nombre.toLowerCase().includes(searchLower)
    );
  }, [inventoryByProduct, searchTerm]);

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
      const { error } = await supabase
        .from('inventario_productos')
        .update({ stock: parseInt(newStock, 10) })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Update local state
      setInventory(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, stock: parseInt(newStock, 10) } : item
        )
      );
      
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 uppercase">Inventario</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
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
                            {/* Additional actions can go here */}
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
    </div>
  );
}
