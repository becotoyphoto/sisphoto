# Software Design Document (SDD) - FotoEvento Brasil

## 1. Visão Geral
FotoEvento Brasil é um marketplace de fotografias de eventos onde fotógrafos podem vender suas fotos diretamente aos participantes. O sistema permite a busca de fotos por evento, categoria, cidade e data.

## 2. Tecnologias (Stack)
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Backend-as-a-Service:** Supabase (Auth, Database, Storage)
- **Pagamentos:** Mercado Pago SDK/API
- **Deploy:** Vercel

## 3. Arquitetura de Dados (Supabase)

### Tabelas
- **profiles (extends auth.users):** id, full_name, avatar_url, role (client, photographer, admin), pix_key.
- **categories:** id, name, slug.
- **events:** id, photographer_id, category_id, name, description, city, state, date, cover_image_url, face_search_enabled (boolean), status (draft, published).
- **photos:** id, event_id, storage_path_watermark, storage_path_original, price, metadata (JSONB for future facial recognition).
- **carts:** id, user_id, status (active, converted).
- **cart_items:** id, cart_id, photo_id.
- **orders:** id, user_id, total_amount, status (pending, paid, cancelled), mercadopago_id.
- **order_items:** id, order_id, photo_id, price_at_purchase.
- **withdrawals:** id, photographer_id, amount, status (requested, completed), requested_at, completed_at.

## 4. Requisitos Funcionais

### 4.1. Usuário (Cliente)
- Navegar pela home e ver categorias.
- Buscar eventos por filtros.
- Visualizar fotos de um evento (com marca d'água).
- Adicionar fotos ao carrinho.
- Pagar via Mercado Pago.
- Acessar área "Minhas Compras" e baixar fotos originais.

### 4.2. Fotógrafo
- Cadastro e aprovação pelo Admin.
- Criar e gerenciar eventos.
- Upload em massa de fotos (Geração automática de marca d'água via Edge Function ou Client-side).
- Definir preço por foto.
- Acompanhar vendas e solicitar saques.

### 4.3. Administrador
- Aprovar novos fotógrafos.
- Gerenciar categorias.
- Visualizar métricas globais de vendas.
- Definir taxa de comissão da plataforma.
- Processar solicitações de saque.

## 5. Design e UI/UX
- **Tema:** Dark Mode (Fundo escuro, detalhes em azul/roxo).
- **Componentes:** Tailwind CSS + Lucide React (ícones).
- **Responsividade:** Mobile-first.

## 6. Segurança e Regras de Negócio
- **Row Level Security (RLS):** Garantir que usuários só vejam seus dados e fotos compradas.
- **Proteção de Imagem:** Fotos públicas sempre exibidas com marca d'água. Caminho da foto original protegido por políticas do Supabase Storage.
- **LGPD:** Consentimento explícito na criação de conta e aviso sobre uso de imagem em eventos.

## 7. Plano de Implementação (Fases)
1. **Fase 1: Frontend** - Estrutura básica, páginas estáticas e componentes de UI.
2. **Fase 2: Autenticação** - Integração com Supabase Auth (Email/Senha e Social).
3. **Fase 3: Banco de Dados** - Aplicação do schema SQL e RLS.
4. **Fase 4: Upload de Fotos** - Lógica de upload e processamento de marca d'água.
5. **Fase 5: Carrinho e Pagamento** - Integração com Mercado Pago e fluxo de checkout.
6. **Fase 6: Área do Fotógrafo** - Dashboard e gestão de eventos.
7. **Fase 7: Admin** - Painel de controle e gestão financeira.
