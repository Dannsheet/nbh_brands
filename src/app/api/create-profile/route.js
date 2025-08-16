// src/app/api/create-profile/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // No exponer detalles en prod; solo para debugging en dev.
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

export async function POST(request) {
  try {
    const body = await request.json()
    const { id, nombre, email, rol = 'cliente' } = body

    if (!id || !email) {
      return NextResponse.json({ error: 'id y email son obligatorios' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('usuarios')
      .insert([{ id, nombre, email, rol }], { returning: 'representation' })

    if (error) {
      console.error('Error insertando perfil (server):', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error en /api/create-profile:', err)
    return NextResponse.json({ error: 'Error inesperado' }, { status: 500 })
  }
}
