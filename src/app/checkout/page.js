// src/app/checkout/page.js
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import CartItem from '@/components/cart/CartItem';

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // form state
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((acc, it) => acc + it.producto.precio * it.cantidad, 0);

  useEffect(() => {
    const fetchCart = async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError('No autenticado');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('carrito')
        .select('id, cantidad, color, talla, producto:productos(*)')
        .eq('usuario_id', user.id); // OJO: tu campo se llama usuario_id en la tabla
      if (error) setError('Error obteniendo carrito');
      else setItems(data);
      setLoading(false);
    };
    fetchCart();
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert('Archivo supera 5MB');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !telefono || !file) {
      alert('Completa todos los campos y selecciona una imagen');
      return;
    }
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Debes iniciar sesión para continuar');
      setSubmitting(false);
      return;
    }

    // 1. Subir comprobante al bucket
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('comprobantes_pago')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadErr) {
      alert('Error subiendo archivo');
      setSubmitting(false);
      return;
    }

    // 2. Crear URL firmada (válida por 1h)
    const { data: signedUrlData } = await supabase.storage
      .from('comprobantes_pago')
      .createSignedUrl(path, 60 * 60);

    const imagen_url = signedUrlData?.signedUrl;

    // 3. Crear orden en tabla ordenes
    const { data: ordenData, error: ordenErr } = await supabase
      .from('ordenes')
      .insert([
        {
          usuario_id: user.id,
          estado: 'pendiente',
          total: subtotal,
          fecha: new Date(),
        },
      ])
      .select()
      .single();

    if (ordenErr) {
      alert('Error creando la orden');
      setSubmitting(false);
      return;
    }

    // 4. Insertar ítems de la orden
    const itemsToInsert = items.map((it) => ({
      orden_id: ordenData.id,
      producto_id: it.producto.id,
      cantidad: it.cantidad,
      precio: it.producto.precio,
    }));

    const { error: itemsErr } = await supabase.from('orden_items').insert(itemsToInsert);
    if (itemsErr) {
      alert('Error guardando items');
      setSubmitting(false);
      return;
    }

    // 5. Guardar comprobante en la tabla comprobantes_pago
    const { error: compErr } = await supabase.from('comprobantes_pago').insert([
      {
        orden_id: ordenData.id,
        usuario_id: user.id,
        metodo: 'transferencia',
        estado: 'pendiente',
        comprobante_url: imagen_url,
        fecha: new Date(),
      },
    ]);

    if (compErr) {
      alert('Error guardando comprobante');
      setSubmitting(false);
      return;
    }

    alert('Comprobante enviado con éxito');
    router.push('/');
  };

  if (loading) return <p className="p-6 text-gray-400">Cargando...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <section className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">CHECKOUT</h1>

      {items.length > 0 ? (
        <div className="space-y-4 border-b border-gray-700 pb-4">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          <p className="text-right text-xl font-bold text-yellow-400">Subtotal: ${subtotal}</p>
        </div>
      ) : (
        <p className="text-gray-400">Tu carrito está vacío.</p>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div className="flex flex-col gap-2">
          <label className="text-sm">NOMBRE</label>
          <input
            className="bg-black border border-gray-700 p-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">TELÉFONO</label>
          <input
            className="bg-black border border-gray-700 p-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">NOTAS (opcional)</label>
          <textarea
            className="bg-black border border-gray-700 p-2"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm">COMPROBANTE DE PAGO (JPG/PNG, máx 5MB)</label>
          <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleFileChange} required />
          {preview && <Image src={preview} alt="Preview" width={200} height={200} className="rounded mt-2" />}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-yellow-400 text-black px-6 py-3 font-bold hover:bg-yellow-500 transition disabled:opacity-50"
        >
          {submitting ? 'ENVIANDO...' : 'ENVIAR COMPROBANTE'}
        </button>
      </form>
    </section>
  );
}
