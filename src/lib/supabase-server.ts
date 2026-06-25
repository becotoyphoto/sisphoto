import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseUrl, getSupabaseAnonKey } from './supabase-env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}

export async function getAuthenticatedUser(request?: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { supabase, user };
  }

  const authHeader = request?.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.slice(7);
    const tokenClient = createSupabaseClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user: tokenUser },
    } = await tokenClient.auth.getUser(accessToken);

    return { supabase, user: tokenUser ?? null };
  }

  return { supabase, user: null };
}
