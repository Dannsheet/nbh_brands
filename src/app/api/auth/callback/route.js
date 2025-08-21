// src/app/api/auth/callback/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { event, session } = await req.json();

    if (event === 'SIGNED_IN' && session) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } else if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error en callback:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
