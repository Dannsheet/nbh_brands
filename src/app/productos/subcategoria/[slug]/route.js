// src/app/productos/subcategoria/[slug]/route.js
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { slug } = params;
  try {
    const { data, error } = await supabaseAdmin
      .from('categorias')
      .select('id, slug, parent_id')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data || !data.parent_id) {
      return NextResponse.redirect(new URL('/productos', request.url), 302); // Redirect to a general page if no parent
    }

    const { data: parent } = await supabaseAdmin
      .from('categorias')
      .select('slug')
      .eq('id', data.parent_id)
      .maybeSingle();

    if (!parent) {
        return NextResponse.redirect(new URL('/productos', request.url), 302);
    }

    const target = `/productos/categoria/${parent.slug}/${data.slug}`;
    return NextResponse.redirect(new URL(target, request.url), 301);
  } catch (err) {
    console.error('Redirect subcategoria error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
