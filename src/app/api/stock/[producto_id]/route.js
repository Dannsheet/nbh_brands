// src/app/api/stock/[producto_id]/route.js
import { NextResponse } from 'next/server';
import createSupabaseServer from '@/lib/supabase/server';

export async function GET(_request, { params }) {
  try {
    const { producto_id } = params;

    if (!producto_id) {
      console.warn('⚠️ Missing product_id in /api/stock');
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    console.log('📦 Fetching inventory for product_id:', producto_id);

    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from('inventario_productos')
      .select('*')
      .eq('producto_id', producto_id);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    console.log(`✅ Found ${data?.length || 0} inventory items`);
    return NextResponse.json({ stock: data || [] });
    
  } catch (error) {
    console.error('❌ Unexpected error in /api/stock:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}