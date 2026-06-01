# Guia de Configuração do Supabase - FotoEvento Brasil

Para colocar o sistema em funcionamento, siga os passos abaixo:

## 1. Criar Projeto
- Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
- Escolha um nome (ex: FotoEvento) e defina a senha do banco de dados.

## 2. Configurar o Banco de Dados
- No painel lateral, vá em **SQL Editor**.
- Clique em **New Query**.
- Copie e cole o conteúdo do arquivo `supabase.sql` do projeto.
- Clique em **Run**. Isso criará todas as tabelas, triggers e políticas de segurança (RLS).

## 3. Configurar Autenticação
- Vá em **Authentication** -> **Providers**.
- O provedor de E-mail já vem habilitado por padrão.
- (Opcional) Configure provedores sociais como Google ou GitHub seguindo a documentação oficial.
- Em **URL Configuration**, adicione `http://localhost:3000` em "Site URL" e nas "Redirect URLs".

## 4. Configurar Storage (Armazenamento)
- Vá em **Storage** e crie dois buckets:
  1. `photos`: Defina como **Public** (onde ficarão as fotos com marca d'água).
  2. `originals`: Defina como **Private** (onde ficarão as fotos originais para download após a compra).

## 5. Variáveis de Ambiente
- Vá em **Project Settings** -> **API**.
- Copie a **Project URL** e a **anon public key**.
- Cole-as no seu arquivo `.env.local`:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=sua-url-aqui
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-key-aqui
  ```

## 6. Políticas de Storage (RLS)
- No menu **Storage**, clique em **Policies**.
- Para o bucket `photos`: Permita `SELECT` para todos os usuários (público).
- Para o bucket `originals`: Permita `SELECT` apenas se o usuário tiver comprado a foto (conforme a lógica do banco de dados).
