-- Tabela para configurações globais da plataforma
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: apenas admin pode ler/escrever
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_admin_all" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inserir comissão padrão (15%)
INSERT INTO platform_settings (key, value)
VALUES ('commission_rate', '{"rate": 0.15}'::jsonb)
ON CONFLICT (key) DO NOTHING;
