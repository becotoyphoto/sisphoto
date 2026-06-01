import { createClient } from '@supabase/supabase-js';

export function isServiceRoleConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && !key.includes('cole_aqui'));
}

export function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !isServiceRoleConfigured()) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
