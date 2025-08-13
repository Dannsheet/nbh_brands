// lib/supabase/route.js
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as getCookies } from 'next/headers';

export async function createSupabaseRouteHandler() {
  const cookies = await getCookies(); // 👈 ahora sí con await
  return createRouteHandlerClient({ cookies });
}
