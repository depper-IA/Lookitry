-- ============================================
-- Migración: Crear tabla notification_preferences
-- ============================================
-- Tarea: 22.6 Crear tabla de preferencias de notificaciones
-- Requirement: 13.10
-- ============================================

-- Crear tabla notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
  
  -- Preferencias de canales
  email_enabled BOOLEAN DEFAULT true NOT NULL,
  whatsapp_enabled BOOLEAN DEFAULT false NOT NULL,
  
  -- Preferencias de recordatorios de suscripción
  reminder_7days BOOLEAN DEFAULT true NOT NULL,
  reminder_3days BOOLEAN DEFAULT true NOT NULL,
  
  -- Preferencias de alertas de uso
  usage_alerts BOOLEAN DEFAULT true NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Crear índice para búsquedas por brand_id
CREATE INDEX IF NOT EXISTS idx_notification_preferences_brand_id 
  ON notification_preferences(brand_id);

-- Crear trigger para updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Notification preferences viewable by all" ON notification_preferences
  FOR SELECT 
  USING (true);

CREATE POLICY "Notification preferences manageable by all" ON notification_preferences
  FOR ALL 
  USING (true);

-- Insertar preferencias por defecto para marcas existentes
INSERT INTO notification_preferences (brand_id, email_enabled, whatsapp_enabled, reminder_7days, reminder_3days, usage_alerts)
SELECT 
  id,
  true,  -- email_enabled por defecto
  false, -- whatsapp_enabled por defecto (no implementado aún)
  true,  -- reminder_7days por defecto
  true,  -- reminder_3days por defecto
  true   -- usage_alerts por defecto
FROM brands
WHERE id NOT IN (SELECT brand_id FROM notification_preferences);

-- ============================================
-- Verificación
-- ============================================

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'notification_preferences') AS column_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name = 'notification_preferences';

-- Verificar índices
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'notification_preferences'
ORDER BY indexname;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notification_preferences'
ORDER BY policyname;

-- Verificar que todas las marcas tienen preferencias
SELECT 
  COUNT(*) AS brands_count,
  (SELECT COUNT(*) FROM notification_preferences) AS preferences_count
FROM brands;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
