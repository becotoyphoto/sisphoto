import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from './supabase-env';

export function isServiceRoleConfigured() {
  const key = getSupabaseServiceRoleKey();
  return Boolean(key && !key.includes('cole_aqui'));
}

export function createServiceClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !isServiceRoleConfigured()) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
