// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdminFromCookieStore } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const auth = await checkIsAdminFromCookieStore(cookieStore);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    // Obtener el conteo de órdenes pendientes
    const { count, error } = await supabaseAdmin
      .from('ordenes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente');

    if (error) {
      console.error('Error fetching pending orders count:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { pendingOrders: count } });

  } catch (err) {
    console.error('Unexpected Error GET /stats:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
