-- Tabla para notificaciones persistentes del panel admin
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warning' | 'error' | 'success'
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  brand_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para consultas recientes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_brand_id
  ON admin_notifications(brand_id);

-- RLS: solo el backend (service role) puede escribir/leer
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política para service role (backend)
CREATE POLICY "service_role_all" ON admin_notifications
  FOR ALL USING (true);
