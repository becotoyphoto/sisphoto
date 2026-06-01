-- Correção das políticas RLS para Profiles

-- Dropar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recriar políticas com permissões corretas
CREATE POLICY "Anyone can view approved photographers" ON profiles FOR SELECT USING (
    role = 'photographer' AND is_approved = true
);

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (
    auth.uid() = id
);

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id
);

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (
    auth.uid() = id
);

-- Admin policies
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
