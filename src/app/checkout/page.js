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
        .eq('user_id', user.id);
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

    // subir archivo
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('comprobantes_pago').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadErr) {
      alert('Error subiendo archivo');
      setSubmitting(false);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from('comprobantes_pago').getPublicUrl(path);
    const imagen_url = publicUrlData.publicUrl;

    // guardar metadata
    const res = await fetch('/api/comprobante', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: user.id,
        imagen_url,
        nombre,
        telefono,
        notas,
      }),
    });
    const respJson = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      alert(respJson.error || 'Error guardando comprobante');
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
          <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} required />
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
