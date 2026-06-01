import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient, isServiceRoleConfigured } from '@/lib/supabase-service';

const seedUsers = [
  { email: 'becotoy@gmail.com', password: 'moraes00', full_name: 'Admin Becotoy', role: 'admin', is_approved: true },
  { email: 'admin2@fotoevento.com', password: 'moraes00', full_name: 'Admin FotoEvento 2', role: 'admin', is_approved: true },
  { email: 'admin3@fotoevento.com', password: 'moraes00', full_name: 'Admin FotoEvento 3', role: 'admin', is_approved: true },
  { email: 'fotografo1@fotoevento.com', password: 'moraes00', full_name: 'Fotografo Teste 1', role: 'photographer', is_approved: true },
  { email: 'fotografo2@fotoevento.com', password: 'moraes00', full_name: 'Fotografo Teste 2', role: 'photographer', is_approved: true },
  { email: 'fotografo3@fotoevento.com', password: 'moraes00', full_name: 'Fotografo Teste 3', role: 'photographer', is_approved: true },
  { email: 'cliente1@fotoevento.com', password: 'moraes00', full_name: 'Cliente Teste 1', role: 'client', is_approved: false },
  { email: 'cliente2@fotoevento.com', password: 'moraes00', full_name: 'Cliente Teste 2', role: 'client', is_approved: false },
  { email: 'cliente3@fotoevento.com', password: 'moraes00', full_name: 'Cliente Teste 3', role: 'client', is_approved: false },
] as const;

async function getOrCreateUserByEmail(
  supabaseAdmin: ReturnType<typeof createServiceClient>,
  user: (typeof seedUsers)[number]
) {
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    throw new Error(listError.message);
  }

  const existingUser = listData.users.find((item) => item.email?.toLowerCase() === user.email.toLowerCase());

  if (existingUser) {
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
        },
      }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    return updatedUser.user;
  }

  const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role,
    },
  });

  if (createError) {
    throw new Error(createError.message);
  }

  return createdUser.user;
}

export async function POST() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    if (!isServiceRoleConfigured()) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createServiceClient();
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const created = [];

    for (const seedUser of seedUsers) {
      const authUser = await getOrCreateUserByEmail(supabaseAdmin, seedUser);

      if (!authUser) {
        throw new Error(`Falha ao criar ${seedUser.email}`);
      }

      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authUser.id,
        full_name: seedUser.full_name,
        role: seedUser.role,
        is_approved: seedUser.is_approved,
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      const { error: loginError } = await anonClient.auth.signInWithPassword({
        email: seedUser.email,
        password: seedUser.password,
      });

      if (loginError) {
        throw new Error(`Login falhou para ${seedUser.email}: ${loginError.message}`);
      }

      await anonClient.auth.signOut();

      created.push({
        email: seedUser.email,
        password: seedUser.password,
        role: seedUser.role,
        is_approved: seedUser.is_approved,
      });
    }

    return NextResponse.json({
      success: true,
      users: created,
    });
  } catch (error) {
    console.error('Seed users error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao criar usuários.' },
      { status: 500 }
    );
  }
}
