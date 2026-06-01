-- Criar usuário admin para o dashboard

-- Primeiro, criar o usuário na autenticação (auth.users)
-- Você precisa executar isso via Supabase Admin API ou Dashboard

-- Depois de criar o usuário em auth.users, insira o profile:
INSERT INTO profiles (id, full_name, role, is_approved, created_at)
VALUES (
  'abbbc7b2-d0af-437a-83d9-cf6bf92990fc',  -- Substitua pelo ID do usuário criado
  'Admin Becotoy',
  'admin',
  true,
  NOW()
);

-- Ou se o usuário já existir no auth.users mas não tiver profile:
-- Busque o ID correto na tabela auth.users primeiro
