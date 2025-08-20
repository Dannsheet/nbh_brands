// src/app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/utils/admin';

export async function GET(request) {
  if (!await checkIsAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener el conteo de órdenes pendientes
    const { count, error } = await supabase
      .from('ordenes')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente');

    if (error) {
      console.error('Error fetching pending orders count:', error);
      throw error;
    }

    return NextResponse.json({ data: { pendingOrders: count } });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
