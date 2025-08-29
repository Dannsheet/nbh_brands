'use client';

import { useState, useEffect } from 'react';
import { TALLAS_CAMISETAS } from '@/constants/tallas';
import { COLORES_CAMISETAS } from '@/constants/colores';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';
import { fetchSafe } from '@/lib/fetchSafe';
import ImageUploader from '@/components/admin/ImageUploader';

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
    imagenes: [],
  });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: catData, error: catError } = await supabase.from('categorias').select('*');
      if (catError) {
        console.error('Error fetching categories', catError);
        setCategories([]);
        setSubcategories([]);
        return;
      }
      setCategories(catData.filter(c => c.parent_id === null));
      setAllSubcategories(catData.filter(c => c.parent_id !== null));
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.categoria_id) {
      const filtered = allSubcategories.filter(sc => sc.parent_id === formData.categoria_id);
      setSubcategories(filtered);
      if (!filtered.find(sc => sc.id === formData.subcategoria_id)) {
        setFormData(prev => ({ ...prev, subcategoria_id: '' }));
      }
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoria_id: '' }));
    }
  }, [formData.categoria_id, formData.subcategoria_id, allSubcategories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Manejo multiselección para tallas y colores
    if (name === 'tallas') {
      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setFormData(prev => ({ ...prev, tallas: options }));
      return;
    }
    if (name === 'colores') {
      const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
      setFormData(prev => ({ ...prev, colores: options, colorPersonalizado: '' }));
      return;
    }
    if (name === 'colorPersonalizado') {
      setFormData(prev => ({ ...prev, colorPersonalizado: value }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'nombre') {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  // Helper para validar UUID
  const isUUID = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Procesar colores finales
    let coloresFinal = formData.colores || [];
    if (coloresFinal.includes('Otros') && formData.colorPersonalizado) {
      coloresFinal = coloresFinal.filter(c => c !== 'Otros').concat(formData.colorPersonalizado);
    }
    const payload = {
      ...formData,
      precio: parseFloat(formData.precio),
      categoria_id: isUUID(formData.categoria_id) ? formData.categoria_id : null,
      subcategoria_id: isUUID(formData.subcategoria_id) ? formData.subcategoria_id : null,
      imagenes: formData.imagenes,
      tallas: formData.tallas || [],
      colores: coloresFinal,
    };

    try {
      const res = await fetchSafe('/api/admin/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.error || res.status !== 201) throw new Error(res.error || 'Error al crear el producto');

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
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgb(250 204 21 / var(--tw-bg-opacity, 1))' }}>Crear Nuevo Producto</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 sm:p-8 space-y-6">
        <ImageUploader onUpload={urls => setFormData(prev => ({ ...prev, imagenes: urls }))} />
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
          <textarea name="descripcion" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-200 text-black"></textarea>
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
            {subcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.nombre}</option>)}
          </select>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="activo" id="activo" checked={formData.activo} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
          <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">Activo</label>
        </div>
        <div>
          <label htmlFor="tallas" className="block text-sm font-medium text-gray-700">Tallas disponibles</label>
          <select
            name="tallas"
            id="tallas"
            multiple
            value={formData.tallas || []}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {TALLAS_CAMISETAS.map(talla => (
              <option key={talla} value={talla}>{talla}</option>
            ))}
          </select>
          <small className="text-gray-500">Ctrl+Click o Cmd+Click para seleccionar varias</small>
        </div>
        <div>
          <label htmlFor="colores" className="block text-sm font-medium text-gray-700">Colores disponibles</label>
          <select
            name="colores"
            id="colores"
            multiple
            value={formData.colores || []}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          >
            {COLORES_CAMISETAS.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
          <small className="text-gray-500">Ctrl+Click o Cmd+Click para seleccionar varias</small>
        </div>
        {formData.colores && formData.colores.includes('Otros') && (
          <div>
            <label htmlFor="colorPersonalizado" className="block text-sm font-medium text-gray-700">Color personalizado</label>
            <input
              type="text"
              name="colorPersonalizado"
              id="colorPersonalizado"
              value={formData.colorPersonalizado || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Ej: Fucsia metálico, Verde neón..."
            />
          </div>
        )}
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