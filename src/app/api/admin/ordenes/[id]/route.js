import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkIsAdminFromCookieStore } from '@/lib/admin-auth';

// GET: Obtener detalles de una orden específica
export async function GET(request, { params }) {
  try {
    const auth = await checkIsAdminFromCookieStore(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('ordenes')
      .select(`
        id,
        usuario:usuarios(id, nombre, email),
        estado,
        total,
        fecha,
        orden_items (
          id,
          cantidad,
          precio,
          inventario:inventario(id, talla, color, producto:productos(id, nombre))
        ),
        comprobantes_pago (id, metodo_pago, estado, comprobante_url, fecha)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order details:', error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });

  } catch (err) {
    console.error('Unexpected Error GET /ordenes/[id]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Actualizar estado de una orden (verificar/rechazar pago)
export async function PUT(request, { params }) {
  try {
    const auth = await checkIsAdminFromCookieStore(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = params;
    const { action, comprobanteId } = await request.json();

    if (!id || !action || !comprobanteId) {
      return NextResponse.json({ error: 'Order ID, action, and comprobanteId are required' }, { status: 400 });
    }

    let rpcName;
    if (action === 'verify') {
      rpcName = 'verificar_pago_y_actualizar_stock';
    } else if (action === 'reject') {
      rpcName = 'rechazar_pago';
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc(rpcName, {
      p_orden_id: id,
      p_comprobante_id: comprobanteId,
    });

    if (error) {
      console.error(`Error executing ${rpcName}:`, error);
      if (error.message.includes('insufficient stock')) {
        return NextResponse.json({ error: 'Stock insuficiente para completar la orden.' }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `Order ${action} processed successfully.` });

  } catch (err) {
    console.error(`Unexpected Error PUT /ordenes/[id]:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
