import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos em e2e/.env. Veja .env.example."
  );
}

// Service role key = acesso total, ignorando RLS. Só pode rodar em Node
// (global-setup / global-teardown / asserts de banco dentro dos specs),
// nunca deve ser importado em código que roda no browser.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
