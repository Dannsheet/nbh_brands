// src/lib/supabase/server.js
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server components, server actions, and route handlers.
 * This function should be called per-request to ensure proper cookie handling.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
const createClient = () => {
  try {
    return createServerComponentClient({ 
      cookies: cookies 
    });
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    throw new Error('Failed to create Supabase client');
  }
};

export default createClient;
