-- =============================================
-- Migration: Criar buckets de storage e políticas RLS
-- =============================================

-- 1. Criar bucket para fotos com marca d'água (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar bucket para fotos originais (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('originals', 'originals', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Políticas RLS para bucket 'photos' (watermarked)
-- =============================================

-- Qualquer um pode ver fotos com marca d'água
CREATE POLICY "Fotos com marca d'água são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Apenas fotógrafos autenticados podem fazer upload para photos
CREATE POLICY "Fotógrafos podem fazer upload de fotos com marca"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
);

-- =============================================
-- Políticas RLS para bucket 'originals' (privado)
-- =============================================

-- Ninguém pode ver originais publicamente (acesso apenas via signed URLs)
CREATE POLICY "Originais são privados - sem acesso público"
ON storage.objects FOR SELECT
USING (bucket_id = 'originals' AND false);

-- Apenas fotógrafos autenticados podem fazer upload para originals
CREATE POLICY "Fotógrafos podem fazer upload de originais"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'originals'
  AND auth.role() = 'authenticated'
);

-- =============================================
-- Adicionar coluna price em cart_items (se não existir)
-- =============================================
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
