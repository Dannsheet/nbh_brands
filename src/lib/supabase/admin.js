import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase para el lado del SERVIDOR (Rutas API, Server Actions)
// Utiliza la clave de servicio (SERVICE_ROLE_KEY) que otorga acceso total y NUNCA debe exponerse al frontend.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is missing from .env');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // No crear sesiones de usuario en el lado del servidor
    autoRefreshToken: false,
  }
});
