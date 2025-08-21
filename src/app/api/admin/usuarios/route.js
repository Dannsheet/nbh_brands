// src/app/api/admin/usuarios/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  // NOTE: This route seems to be for a single user (`/api/admin/usuarios/[id]`)
  // but is located at `/api/admin/usuarios/route.js`. This may need correction.
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 });
  }

  try {
    const auth = await checkIsAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, email, rol, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error GET /usuarios/${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error(`Unexpected Error GET /usuarios/${id}:`, err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
