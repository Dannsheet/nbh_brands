import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('etiqueta', 'destacado')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching productos destacados:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos destacados' },
      { status: 500 }
    );
  }
}
