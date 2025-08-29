'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fetchSafe } from '@/lib/fetchSafe';

export default function NuevoInventarioPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    variantes: [], // [{ color, talla, stock }]
  });
  const [productoTallas, setProductoTallas] = useState([]);
  const [productoColores, setProductoColores] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('productos').select('id, nombre').order('nombre');
      if (error) {
        console.error('Error fetching products:', error);
        setError('No se pudieron cargar los productos.');
      } else {
        setProducts(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, producto_id: data[0].id }));
        }
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchAtributos() {
      if (!formData.producto_id) return;
      const { data, error } = await supabase
        .from('productos')
        .select('tallas, colores')
        .eq('id', formData.producto_id)
        .single();
      if (!error && data) {
        setProductoTallas(Array.isArray(data.tallas) ? data.tallas : []);
        setProductoColores(Array.isArray(data.colores) ? data.colores : []);
        const variantes = [];
        for (const color of (Array.isArray(data.colores) ? data.colores : [])) {
          for (const talla of (Array.isArray(data.tallas) ? data.tallas : [])) {
            variantes.push({ color, talla, stock: 0 });
          }
        }
        setFormData(prev => ({ ...prev, variantes }));
      } else {
        setProductoTallas([]);
        setProductoColores([]);
        setFormData(prev => ({ ...prev, variantes: [] }));
      }
    }
    fetchAtributos();
  }, [formData.producto_id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value, 10) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetchSafe('/api/admin/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: formData.producto_id,
          variantes: formData.variantes
        }),
      });
      if (res.error || res.status !== 200) throw new Error(res.error || 'Algo salió mal');
      toast.success('Item de inventario añadido correctamente');
      router.push('/admin/inventario');
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgb(250 204 21 / var(--tw-bg-opacity, 1))' }}>Añadir Item al Inventario</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 sm:p-8 space-y-6">
        <div>
          <label htmlFor="producto_id" className="block text-sm font-medium text-gray-700">Producto</label>
          <select name="producto_id" id="producto_id" value={formData.producto_id} onChange={handleChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock por combinación</label>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Color</th>
                  <th className="px-4 py-2">Talla</th>
                  <th className="px-4 py-2">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.variantes && formData.variantes.map((v, idx) => (
                  <tr key={v.color + '-' + v.talla}>
                    <td className="px-4 py-2">{v.color}</td>
                    <td className="px-4 py-2">{v.talla}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={e => {
                          const newStock = parseInt(e.target.value, 10) || 0;
                          setFormData(prev => ({
                            ...prev,
                            variantes: prev.variantes.map((vv, i) => i === idx ? { ...vv, stock: newStock } : vv)
                          }));
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Link href="/admin/inventario" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Añadiendo...' : 'Añadir Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
