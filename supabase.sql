-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis (estende auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'photographer', 'admin')),
    pix_key TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Categorias
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Eventos
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photographer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    date DATE NOT NULL,
    cover_image_url TEXT,
    face_search_enabled BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Fotos
CREATE TABLE photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    storage_path_watermark TEXT NOT NULL,
    storage_path_original TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 15.00,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Carrinhos
CREATE TABLE carts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Itens do Carrinho
CREATE TABLE cart_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(cart_id, photo_id)
);

-- 7. Pedidos (Orders)
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    mercadopago_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Itens do Pedido
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
    price_at_purchase DECIMAL(10,2) NOT NULL
);

-- 9. Saques (Withdrawals)
CREATE TABLE withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photographer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'completed', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- CONFIGURAÇÃO DE RLS (Row Level Security)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (role = 'photographer' AND is_approved = true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para Categories
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON categories ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Políticas para Events
CREATE POLICY "Anyone can view published events" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "Photographers can manage their own events" ON events ALL USING (photographer_id = auth.uid());
CREATE POLICY "Admins can view all events" ON events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Políticas para Photos
CREATE POLICY "Anyone can view photos of published events" ON photos FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = photos.event_id AND events.status = 'published')
);
CREATE POLICY "Photographers can manage photos of their events" ON photos ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = photos.event_id AND events.photographer_id = auth.uid())
);

-- Política para download da foto original (apenas se comprou)
CREATE POLICY "Users can access original photos they purchased" ON photos FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items 
        JOIN orders ON orders.id = order_items.order_id
        WHERE order_items.photo_id = photos.id AND orders.user_id = auth.uid() AND orders.status = 'paid'
    )
);

-- Políticas para Carts
CREATE POLICY "Users can manage their own cart" ON carts ALL USING (user_id = auth.uid());

-- Políticas para Cart Items
CREATE POLICY "Users can manage cart items in their own cart" ON cart_items ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- Políticas para Orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Photographers can view orders for their photos" ON orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM order_items
        JOIN photos ON photos.id = order_items.photo_id
        JOIN events ON events.id = photos.event_id
        WHERE order_items.order_id = orders.id AND events.photographer_id = auth.uid()
    )
);

-- Políticas para Withdrawals
CREATE POLICY "Photographers can view their own withdrawals" ON withdrawals FOR SELECT USING (photographer_id = auth.uid());
CREATE POLICY "Admins can manage all withdrawals" ON withdrawals ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- TRIGGER para criar profile ao criar auth.user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'client'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Inserir categorias padrão
INSERT INTO categories (name, slug) VALUES
  ('Futebol', 'futebol'),
  ('Crossfit', 'crossfit'),
  ('Ciclismo', 'ciclismo'),
  ('Beach Tennis', 'beach-tennis'),
  ('Futsal', 'futsal'),
  ('Corrida', 'corrida'),
  ('Natação', 'natacao'),
  ('Vôlei', 'volei'),
  ('Futevôlei', 'futevolei'),
  ('Eventos', 'eventos'),
  ('Basquete', 'basquete'),
  ('Artes Marciais', 'artes-marciais'),
  ('Surf', 'surf'),
  ('Motociclismo', 'motociclismo'),
  ('Formaturas', 'formaturas'),
  ('Jiu-jítsu', 'jiu-jitsu'),
  ('Grau', 'grau'),
  ('Padel', 'padel'),
  ('Tênis', 'tenis'),
  ('Festas', 'festas'),
  ('Automotiva', 'automotiva'),
  ('Mountain Bike', 'mountain-bike'),
  ('Treinos', 'treinos'),
  ('Ginástica', 'ginastica');
