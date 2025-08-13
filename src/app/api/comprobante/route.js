// src/app/api/comprobante/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { usuario_id, orden_id = null, imagen_url, nombre, telefono, notas = '' } = body;

    if (!usuario_id || !imagen_url || !nombre || !telefono) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const { error } = await supabase.from('comprobantes_pago').insert({
      usuario_id,
      orden_id,
      imagen_url,
      nombre,
      telefono,
      notas,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error comprobante:', err);
    return NextResponse.json({ error: 'Error al guardar comprobante' }, { status: 500 });
  }
}
