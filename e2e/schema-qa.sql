-- ============================================
-- SCHEMA COMPLETO: fotoevento-qa
-- Exportado de: jprjiibvpqalelrajkhh (producao)
-- Data: 2026-06-19
-- SOMO ESTRUTURA, SEM DADOS
-- ============================================

-- ============================================
-- 1. TABELAS
-- ============================================

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "full_name" TEXT,
  "avatar_url" TEXT,
  "role" TEXT NOT NULL DEFAULT 'client',
  "pix_key" TEXT,
  "is_approved" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "image_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "photographer_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "category_id" UUID REFERENCES categories(id) ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "cover_image_url" TEXT,
  "face_search_enabled" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "photos" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  "storage_path_watermark" TEXT,
  "storage_path_original" TEXT,
  "price" NUMERIC(10,2) NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "carts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cart_id" UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  "photo_id" UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  "added_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "price" NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "total_amount" NUMERIC(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "mercadopago_id" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "photo_id" UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  "price_at_purchase" NUMERIC(10,2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "photographer_id" UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "amount" NUMERIC(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "requested_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_photographer_id ON events(photographer_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_photo_id ON cart_items(photo_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_photo_id ON order_items(photo_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_photographer_id ON withdrawals(photographer_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- profiles: leitura pública, escrita pelo próprio usuário
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- categories: leitura pública
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- events: leitura pública (eventos publicados), escrita pelo dono ou admin
CREATE POLICY "events_select_public" ON events FOR SELECT USING (status = 'published' OR auth.uid() = photographer_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "events_insert_photographer" ON events FOR INSERT
  WITH CHECK (
    auth.uid() = photographer_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'photographer' AND is_approved = true)
  );
CREATE POLICY "events_update_owner" ON events FOR UPDATE
  USING (
    auth.uid() = photographer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "events_delete_owner" ON events FOR DELETE
  USING (
    auth.uid() = photographer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- photos: leitura pública (para eventos publicados), escrita pelo dono do evento ou admin
CREATE POLICY "photos_select_public" ON photos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND status = 'published')
    OR EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND photographer_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "photos_insert_owner" ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND photographer_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "photos_delete_owner" ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events WHERE id = event_id AND photographer_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- carts: cada usuário lê/escreve seu próprio carrinho
CREATE POLICY "carts_select_own" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "carts_insert_own" ON carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_update_own" ON carts FOR UPDATE USING (auth.uid() = user_id);

-- cart_items: cada usuário lê/escreve itens do seu carrinho
CREATE POLICY "cart_items_select_own" ON cart_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid())
  );
CREATE POLICY "cart_items_insert_own" ON cart_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid())
  );
CREATE POLICY "cart_items_delete_own" ON cart_items FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND user_id = auth.uid())
  );

-- orders: cada usuário lê seus próprios pedidos
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- order_items: cada usuário lê itens dos seus pedidos
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
  );

-- withdrawals: fotógrafo lê/escreve seus próprios saques
CREATE POLICY "withdrawals_select_own" ON withdrawals FOR SELECT
  USING (auth.uid() = photographer_id);
CREATE POLICY "withdrawals_insert_own" ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = photographer_id);

-- ============================================
-- 4. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('photos', 'photos', true),
  ('originals', 'originals', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: photos bucket (público para leitura)
CREATE POLICY "photos_bucket_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "photos_bucket_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

CREATE POLICY "photos_bucket_delete_owner" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- Storage policies: originals bucket (privado)
CREATE POLICY "originals_bucket_select_auth" ON storage.objects
  FOR SELECT USING (bucket_id = 'originals' AND auth.role() = 'authenticated');

CREATE POLICY "originals_bucket_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'originals' AND auth.role() = 'authenticated');

CREATE POLICY "originals_bucket_delete_auth" ON storage.objects
  FOR DELETE USING (bucket_id = 'originals' AND auth.role() = 'authenticated');
