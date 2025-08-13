import { createClient } from '@supabase/supabase-js';

// 1. Check if running in browser
const isBrowser = typeof window !== 'undefined';

// 2. Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// 3. Create a single instance of the Supabase client
let supabaseClient;

const createSupabaseClient = () => {
  // Return existing instance if it exists
  if (isBrowser && window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__;
  }

  // Create new instance
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // Store in window for browser environment
  if (isBrowser) {
    window.__SUPABASE_CLIENT__ = client;
  }

  return client;
};

// 4. Initialize the client
if (isBrowser) {
  supabaseClient = createSupabaseClient();
}

// 5. Export the client
export { supabaseClient as supabase };

// 6. For debugging
if (process.env.NODE_ENV !== 'production' && isBrowser) {
  console.log('Supabase client initialized:', !!window.__SUPABASE_CLIENT__);
}
