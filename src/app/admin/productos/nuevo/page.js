'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';

export default function NuevoProductoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    subcategoria_id: '',
    activo: true,
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: catData, error: catError } = await supabase.from('categorias').select('*');
      if (catError) console.error('Error fetching categories', catError);
      else setCategories(catData);

      const { data: subcatData, error: subcatError } = await supabase.from('subcategorias').select('*');
      if (subcatError) console.error('Error fetching subcategories', subcatError);
      else setSubcategories(subcatData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.categoria_id) {
      const filtered = subcategories.filter(sc => sc.categoria_id === parseInt(formData.categoria_id, 10));
      setFilteredSubcategories(filtered);
      if (filtered.length > 0) {
        setFormData(prev => ({ ...prev, subcategoria_id: '' }));
      }
    } else {
      setFilteredSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    }
  }, [formData.categoria_id, subcategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'nombre') {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      precio: parseFloat(formData.precio),
      categoria_id: formData.categoria_id ? parseInt(formData.categoria_id, 10) : null,
      subcategoria_id: formData.subcategoria_id ? parseInt(formData.subcategoria_id, 10) : null,
    };

    try {
      const res = await fetch('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el producto');

      toast.success('Producto creado con éxito');
      router.push('/admin/productos');
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Crear Nuevo Producto</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 sm:p-8 space-y-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
          <input type="text" name="slug" id="slug" value={formData.slug} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50" />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
        </div>
        <div>
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700">Precio</label>
          <input type="number" name="precio" id="precio" value={formData.precio} onChange={handleChange} required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700">Categoría</label>
          <select name="categoria_id" id="categoria_id" value={formData.categoria_id} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
            <option value="">Seleccionar categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="subcategoria_id" className="block text-sm font-medium text-gray-700">Subcategoría</label>
          <select name="subcategoria_id" id="subcategoria_id" value={formData.subcategoria_id} onChange={handleChange} disabled={!formData.categoria_id} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md disabled:bg-gray-100">
            <option value="">Seleccionar subcategoría</option>
            {filteredSubcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.nombre}</option>)}
          </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Activo</label>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Link href="/admin/productos" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancelar</Link>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {isSubmitting ? 'Creando...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}