// src/app/api/admin/usuarios/[id]/route.js
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const supabase = createClient();
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  }

  try {
    const check = await checkIsAdmin(req);
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: check.status });
    }

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching usuario:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuario', details: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('❌ Unexpected error in GET /api/admin/usuarios/[id]:', err);
    return NextResponse.json(
      { error: 'Error interno', details: process.env.NODE_ENV === 'development' ? String(err) : undefined },
      { status: 500 }
    );
  }
}
