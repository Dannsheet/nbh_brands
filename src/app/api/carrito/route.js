import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET: Obtener el carrito del usuario
export async function GET(req) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('carrito')
    .select(`id, cantidad, color, talla, productos:producto_id (nombre, precio, imagen_url, slug)`)
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: true });

  if (error) {
    console.error('Error al obtener carrito:', error);
    return NextResponse.json({ error: 'Error al obtener carrito' }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

// POST: Añadir un ítem al carrito
export async function POST(req) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { producto_id, cantidad, color, talla } = await req.json();

  // Aquí iría la lógica de validación de stock que teníamos...

  const { data, error } = await supabase
    .from('carrito')
    .insert({ producto_id, cantidad, color, talla, usuario_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error al añadir al carrito:', error);
    return NextResponse.json({ error: 'Error al añadir al carrito' }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

// DELETE: Eliminar un ítem del carrito
export async function DELETE(req) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await req.json();

  const { error } = await supabase
    .from('carrito')
    .delete()
    .eq('id', id)
    .eq('usuario_id', user.id); // Seguridad para que un usuario no borre ítems de otro

  if (error) {
    return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH: Actualizar la cantidad de un ítem
export async function PATCH(req) {
  const supabase = createRouteHandlerClient({ cookies: () => cookies() });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id, cantidad } = await req.json();

  if (cantidad < 1) {
    return NextResponse.json({ error: 'La cantidad no puede ser menor a 1' }, { status: 400 });
  }

  const { error } = await supabase
    .from('carrito')
    .update({ cantidad })
    .eq('id', id)
    .eq('usuario_id', user.id); // Seguridad

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar la cantidad' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
